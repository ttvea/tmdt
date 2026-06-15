import api from './axios'

export interface ApplicationResponse {
  id: number
  studentRequestId: number
  tutorId: number
  studentUserId?: number
  studentName?: string
  studentAvatar?: string
  tutorName: string
  tutorAvatar: string
  introduction: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

export interface ApplyRequest {
  studentRequestId: number
  introduction: string
}

export interface ApplicationPayload {
  studentRequestId: number
  introduction: string
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
    const candidate = record.name ?? record.fullName ?? record.username ?? record.title ?? record.label
    if (candidate !== undefined && candidate !== null) return toDisplayString(candidate)

    if ('id' in record) return String(record.id ?? '')
  }

  return String(value)
}

function normalizeApplication(application: any): ApplicationResponse {
  console.log('[normalizeApplication] raw application:', application)
  const studentRequestId = Number(application?.studentRequestId ?? application?.studentRequest?.id ?? 0)
  console.log('[normalizeApplication] parsed studentRequestId:', studentRequestId)

  return {
    id: Number(application?.id ?? 0),
    studentRequestId,
    tutorId: Number(application?.tutorId ?? application?.tutor?.id ?? 0),
    studentUserId: application?.studentUserId ? Number(application.studentUserId) : undefined,
    studentName: toDisplayString(application?.studentName ?? application?.studentRequest?.user?.fullName),
    studentAvatar: toDisplayString(application?.studentAvatar ?? application?.studentRequest?.user?.avatar),
    tutorName: toDisplayString(application?.tutorName ?? application?.tutor?.name ?? application?.tutor?.fullName),
    tutorAvatar: toDisplayString(application?.tutorAvatar ?? application?.tutor?.avatar),
    introduction: toDisplayString(application?.introduction),
    status: toDisplayString(application?.status).toUpperCase() as ApplicationResponse['status'],
    createdAt: toDisplayString(application?.createdAt),
  }
}

function extractArrayResponse(responseData: unknown): any[] {
  const data = (responseData as any)?.data ?? responseData
  if (Array.isArray(data)) return data
  if (Array.isArray((data as any)?.items)) return (data as any).items
  return []
}

function getAuthHeader() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Ứng tuyển vào bảng tin của học viên
 */
export async function applyToStudentRequest(payload: ApplyRequest) {
  const response = await api.post('/api/applications', payload, {
    headers: getAuthHeader(),
  })
  return response.data
}

/**
 * Lấy danh sách ứng tuyển của một bảng tin (dành cho học viên)
 */
export async function getReceivedApplications(): Promise<ApplicationResponse[]> {
  const response = await api.get(
    '/api/applications/received',
    {
      headers: getAuthHeader(),
    }
  )

  return extractArrayResponse(response.data)
    .map(normalizeApplication)
}

/**
 * Lấy danh sách ứng tuyển của gia sư (dành cho gia sư)
 */
export async function getMyApplications(): Promise<ApplicationResponse[]> {
  const response = await api.get('/api/applications/my-applications', {
    headers: getAuthHeader(),
  })

  return extractArrayResponse(response.data).map(normalizeApplication)
}

/**
 * Chấp nhận ứng tuyển (dành cho học viên)
 */
export async function acceptApplication(applicationId: number) {
  const response = await api.put(`/api/applications/${applicationId}/accept`, {}, {
    headers: getAuthHeader(),
  })
  return response.data
}

/**
 * Từ chối ứng tuyển (dành cho học viên)
 */
export async function rejectApplication(applicationId: number) {
  const response = await api.put(`/api/applications/${applicationId}/reject`, {}, {
    headers: getAuthHeader(),
  })
  return response.data
}
