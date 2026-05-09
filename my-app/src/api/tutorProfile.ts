import api from './axios'

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
  subjects: string
  bio: string
  certificateUrl: string
  isVerified: boolean
}

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
  subjects: string
  bio: string
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

export async function getTutorProfileForEdit(userId: number): Promise<TutorProfileRequest> {
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

export async function uploadAvatar(userId: number, file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post(`/api/tutor-profile/${userId}/avatar`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

export async function uploadCertificate(userId: number, file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post(`/api/tutor-profile/${userId}/certificate`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}
