import api from './axios'
import { getReceivedApplications, type ApplicationResponse } from './applications'

export interface StudentRequestsWithApplications {
  id: number
  contactName: string
  phone: string
  address: string
  subjectTags: string
  gradeLevel: string
  studyTimeTags: string
  teachingMode: 'ONLINE' | 'OFFLINE'
  sessionsPerWeek: number
  budget: number
  requirements: string
  createdAt: string
  userId: number
  status: string
  // Applications
  applications: ApplicationResponse[]
  totalApplications: number
  pendingApplications: number
  acceptedApplications: number
  rejectedApplications: number
}

export interface ApplicationSummary {
  id: number
  studentRequestId: number
  tutorId: number
  tutorName: string
  tutorAvatar: string
  introduction: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

function getAuthHeader() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    return value.map(toDisplayString).filter(Boolean).join(', ')
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const candidate = record.name ?? record.title ?? record.label ?? record.value ?? record.text
    if (candidate !== undefined && candidate !== null) {
      return toDisplayString(candidate)
    }

    if ('id' in record) {
      return String(record.id ?? '')
    }
  }

  return String(value)
}

function normalizeApplications(rawApplications: unknown): ApplicationSummary[] {
  if (!Array.isArray(rawApplications)) return []

  return rawApplications.map((application: any) => ({
    id: Number(application?.id ?? 0),
    studentRequestId: Number(application?.studentRequestId ?? application?.studentRequest?.id ?? 0),
    tutorId: Number(application?.tutorId ?? application?.tutor?.id ?? 0),
    tutorName: toDisplayString(application?.tutorName ?? application?.tutor?.name),
    tutorAvatar: toDisplayString(application?.tutorAvatar ?? application?.tutor?.avatar),
    introduction: toDisplayString(application?.introduction),
    status: toDisplayString(application?.status).toUpperCase() as ApplicationSummary['status'],
    createdAt: toDisplayString(application?.createdAt),
  }))
}

function normalizeStudentRequest(request: any): StudentRequestsWithApplications {
  const applications = normalizeApplications(request?.applications ?? request?.responses)

  return {
    id: Number(request?.id ?? 0),
    contactName: toDisplayString(request?.contactName),
    phone: toDisplayString(request?.phone),
    address: toDisplayString(request?.address),
    subjectTags: toDisplayString(request?.subjectTags ?? request?.subject?.name),
    gradeLevel: toDisplayString(request?.gradeLevel ?? request?.gradeLevelName ?? request?.gradeLevel?.name),
    studyTimeTags: toDisplayString(request?.studyTimeTags),
    teachingMode: toDisplayString(request?.teachingMode).toUpperCase() as 'ONLINE' | 'OFFLINE',
    sessionsPerWeek: Number(request?.sessionsPerWeek ?? 0),
    budget: Number(request?.budget ?? 0),
    requirements: toDisplayString(request?.requirements),
    createdAt: toDisplayString(request?.createdAt),
    userId: Number(request?.userId ?? request?.user?.id ?? 0),
    status: toDisplayString(request?.status).toUpperCase(),
    applications,
    totalApplications: Number(request?.totalApplications ?? applications.length ?? 0),
    pendingApplications: Number(request?.pendingApplications ?? applications.filter((a) => a.status === 'PENDING').length ?? 0),
    acceptedApplications: Number(request?.acceptedApplications ?? applications.filter((a) => a.status === 'ACCEPTED').length ?? 0),
    rejectedApplications: Number(request?.rejectedApplications ?? applications.filter((a) => a.status === 'REJECTED').length ?? 0),
  }
}

/**
 * Lấy danh sách bảng tin của học viên hiện tại
 * GET /api/student-requests/my-requests
 * Kèm theo danh sách ứng tuyển cho từng bảng tin (lọc từ getReceivedApplications)
 */
export async function getMyStudentRequests(): Promise<StudentRequestsWithApplications[]> {
  console.log('[studentRequests] GET /api/student-requests/my-requests start')

  const response = await api.get('/api/student-requests/my-requests', {
    headers: getAuthHeader(),
  })

  console.log('[studentRequests] response status:', response.status)
  console.log('[studentRequests] raw response data:', response.data)

  // Backend có thể trả về dữ liệu trong response.data.data hoặc trực tiếp
  const data = response.data?.data ?? response.data
  console.log('[studentRequests] normalized data:', data)

  if (!Array.isArray(data)) {
    console.warn('[studentRequests] Expected array but received:', data)
    return []
  }

  const requests = data.map(normalizeStudentRequest)

  // Kiểm tra xem backend đã trả về applications chưa (nếu request nào có rồi thì bỏ qua)
  const allHaveApplications = requests.every(
    (r) => r.totalApplications > 0 || r.applications.length > 0
  )
  if (allHaveApplications) {
    return requests
  }

  // Nếu chưa có, fetch danh sách ứng tuyển của học viên và map vào từng bảng tin
  try {
    const allApplications: ApplicationResponse[] = await getReceivedApplications()
    console.log('[studentRequests] all applications from server:', allApplications)

    return requests.map((request) => {
      const requestApplications = allApplications.filter(
        (app) => app.studentRequestId === request.id
      )
      return {
        ...request,
        applications: requestApplications,
        totalApplications: requestApplications.length,
        pendingApplications: requestApplications.filter((a) => a.status === 'PENDING').length,
        acceptedApplications: requestApplications.filter((a) => a.status === 'ACCEPTED').length,
        rejectedApplications: requestApplications.filter((a) => a.status === 'REJECTED').length,
      }
    })
  } catch (error) {
    console.warn('[studentRequests] Failed to load applications:', error)
    return requests
  }
}

/**
 * Lấy chi tiết bảng tin kèm theo ứng tuyển
 */
export async function getStudentRequestWithApplications(
  requestId: number
): Promise<StudentRequestsWithApplications> {
  const response = await api.get(`/api/student-requests/${requestId}/with-applications`, {
    headers: getAuthHeader(),
  })
  const data = response.data?.data ?? response.data
  return normalizeStudentRequest(data)
}