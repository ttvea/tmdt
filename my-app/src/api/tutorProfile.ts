import api from './axios'

export interface SubjectInfo {
  id: number
  name: string
  categoryName: string | null
}

export interface TutorSearchParams {
  name?: string
  occupation?: string
  experience?: string
  subjectName?: string
}

export interface TutorProfileResponse {
  userId: number
  fullName: string
  email: string
  phone: string
  avatar: string
  gender: string
  birthday: number
  occupationType: string
  university: string
  studentYear: number
  major: string
  schoolName: string
  teachMajor: string
  graduatedSchool: string
  graduatedYear: number
  experience: string
  subjects: SubjectInfo[]
  bio: string
  certificateUrl: string
  isVerified: boolean
}

export interface TutorSearchResponse {
  id: number
  profileId?: number
  userId?: number
  fullName: string
  avatar: string
  major: string
  experience: string
  isVerified: boolean
  subjects: string[]
}

interface TutorSearchResponseRaw {
  id: number
  profileId?: number
  userId?: number
  fullName: string
  avatar: string
  major: string
  experience: string
  verified?: boolean
  isVerified?: boolean
  subjects: string[]
}

export type TutorProfileSearchItem = TutorSearchResponse

export interface TutorProfileRequest {
  fullName: string
  phone: string
  birthday: number | null
  gender: string
  occupationType: string
  university: string
  studentYear: number | null
  major: string
  schoolName: string
  teachMajor: string
  graduatedSchool: string
  graduatedYear: number | null
  experience: string
  subjectIds: number[]
  bio: string
}

export interface TutorProfileEditResponse {
  fullName: string
  phone: string
  birthday: number | null
  gender: string
  occupationType: string
  university: string
  studentYear: number | null
  major: string
  schoolName: string
  teachMajor: string
  graduatedSchool: string
  graduatedYear: number | null
  experience: string
  subjectIds: number[]
  bio: string
}

export interface SubjectOption {
  id: number
  name: string
  description: string | null
  category: { id: number; name: string } | null
  gradeLevels: { id: number; name: string }[]
}

export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

function getAuthHeader() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getTutorProfile(userId: number): Promise<TutorProfileResponse> {
  const res = await api.get(`/api/tutor-profile/${userId}`, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function getPublicTutorProfile(profileId: number): Promise<TutorProfileResponse> {
  const res = await api.get(`/api/tutor-profile/public/${profileId}`)
  return res.data
}

export async function getTutorProfileForEdit(userId: number): Promise<TutorProfileEditResponse> {
  const res = await api.get(`/api/tutor-profile/${userId}/edit`, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function saveTutorProfile(
  userId: number,
  request: TutorProfileRequest
): Promise<TutorProfileResponse> {
  const res = await api.put(`/api/tutor-profile/${userId}`, request, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function getAllSubjects(): Promise<SubjectOption[]> {
  const res = await api.get('/api/subject/all')
  return res.data
}

export async function uploadAvatar(userId: number, file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post(`/api/tutor-profile/${userId}/avatar`, formData, {
    headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function uploadCertificate(userId: number, file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post(`/api/tutor-profile/${userId}/certificate`, formData, {
    headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

function isTutorProfileArray(data: unknown): data is TutorProfileSearchItem[] {
  return Array.isArray(data)
}

function normalizeTutorSearchItem(rawItem: TutorSearchResponseRaw): TutorSearchResponse {
  return {
    id: rawItem.id,
    profileId: rawItem.profileId ?? rawItem.id,
    userId: rawItem.userId,
    fullName: rawItem.fullName,
    avatar: rawItem.avatar,
    major: rawItem.major,
    experience: rawItem.experience,
    isVerified: rawItem.isVerified ?? rawItem.verified ?? false,
    subjects: rawItem.subjects,
  }
}

function normalizeTutorSearchPayload(payload: unknown): TutorSearchResponse[] {
  if (isTutorProfileArray(payload)) {
    return payload as TutorSearchResponse[]
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'content' in payload &&
    Array.isArray((payload as { content?: unknown }).content)
  ) {
    return (payload as { content: TutorSearchResponseRaw[] }).content.map(normalizeTutorSearchItem)
  }

  return []
}

export async function searchTutorProfiles(
  params: TutorSearchParams = {}
): Promise<TutorProfileSearchItem[]> {
  const normalizedParams = {
    ...(params.name ? { name: params.name } : {}),
    ...(params.occupation ? { occupation: params.occupation } : {}),
    ...(params.experience ? { experience: params.experience } : {}),
    ...(params.subjectName ? { subjectName: params.subjectName } : {}),
  }

  const res = await api.get('/api/tutor-profile/searchTutor', {
    params: normalizedParams,
    headers: getAuthHeader(),
  })

  const payload = res.data as unknown
  return normalizeTutorSearchPayload(payload)
}

export async function searchTutorProfilesPaged(
  params: TutorSearchParams & { page?: number; size?: number } = {}
): Promise<Page<TutorProfileSearchItem>> {
  const normalizedParams: Record<string, unknown> = {
    ...(params.name ? { name: params.name } : {}),
    ...(params.occupation ? { occupation: params.occupation } : {}),
    ...(params.experience ? { experience: params.experience } : {}),
    ...(params.subjectName ? { subjectName: params.subjectName } : {}),
  }

  if (typeof params.page === 'number') {
    normalizedParams.page = params.page
  }
  if (typeof params.size === 'number') {
    normalizedParams.size = params.size
  }

  const res = await api.get('/api/tutor-profile/searchTutor', {
    params: normalizedParams,
    headers: getAuthHeader(),
  })

  const payload = res.data as Page<TutorSearchResponseRaw> & { content?: TutorSearchResponseRaw[] }

  return {
    ...payload,
    content: Array.isArray(payload.content)
      ? payload.content.map(normalizeTutorSearchItem)
      : [],
  }
}
