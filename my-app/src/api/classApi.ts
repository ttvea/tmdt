import api from './axios'

export type TeachingMode = 'ONLINE' | 'OFFLINE'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ClassStatus = 'OPEN' | 'CLOSED' | 'COMPLETED'

export interface ScheduleRequest {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface ClassCreateRequest {
  title: string
  description: string
  categoryId: number | null
  subjectId: number | null
  gradeLevelId: number | null
  teachingMode: TeachingMode
  pricePerCourse: number
  totalSessions: number | null
  maxStudents: number
  address: string | null
  city: string | null
  thumbnailUrl: string | null
  schedules: ScheduleRequest[]
}

export interface ScheduleResponse {
  id: number
  dayOfWeek: number
  dayLabel: string
  startTime: string
  endTime: string
}

export interface ClassResponse {
  id: number
  tutorId: number
  title: string
  description: string
  categoryId: number
  categoryName: string | null
  subjectId: number
  subjectName: string
  gradeLevelId: number
  gradeLevelName: string
  teachingMode: TeachingMode
  pricePerCourse: number
  totalSessions: number
  maxStudents: number
  currentStudents: number
  approvalStatus: ApprovalStatus
  rejectReason: string | null
  status: ClassStatus
  address: string | null
  city: string | null
  thumbnailUrl: string | null
  schedules: ScheduleResponse[]
  createdAt: string
  updatedAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function getAuthHeader() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function createClass(request: ClassCreateRequest): Promise<ClassResponse> {
  const res = await api.post('/api/classes', request, { headers: getAuthHeader() })
  return res.data
}

export async function getMyClasses(page = 0, size = 10): Promise<PageResponse<ClassResponse>> {
  const res = await api.get('/api/classes/my', {
    headers: getAuthHeader(),
    params: { page, size },
  })
  return res.data
}

export async function getMyClassDetail(classId: number): Promise<ClassResponse> {
  const res = await api.get(`/api/classes/my/${classId}`, { headers: getAuthHeader() })
  return res.data
}

export async function updateClassStatus(classId: number, status: ClassStatus): Promise<ClassResponse> {
  const res = await api.patch(`/api/classes/my/${classId}/status`, null, {
    headers: getAuthHeader(),
    params: { status },
  })
  return res.data
}

export async function searchClassesPaged(params: {
  subjectId?: number
  gradeLevelId?: number
  teachingMode?: string
  city?: string
  title?: string
  page?: number
  size?: number
}): Promise<PageResponse<ClassResponse>> {
  const res = await api.get('/api/classes/search', { params })
  return res.data
}

export async function getClassDetail(classId: number): Promise<ClassResponse> {
  const res = await api.get(`/api/classes/${classId}`)
  return res.data
}

export async function getTutorClasses(tutorId: number, page = 0, size = 100): Promise<PageResponse<ClassResponse>> {
  const res = await api.get(`/api/classes/tutor/${tutorId}`, {
    params: { page, size },
  })
  return res.data
}

export interface GradeLevelOption {
  id: number
  name: string
}

export async function getAllGradeLevels(): Promise<GradeLevelOption[]> {
  const res = await api.get('/api/subject-level/all')
  return res.data
}

export interface CategoryOption {
  id: number
  name: string
  description: string | null
}

export async function getAllCategories(): Promise<CategoryOption[]> {
  const res = await api.get('/api/category/all')
  return res.data
}

export type EnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CASH_REQUESTED' | 'PAID'

export interface EnrollmentResponse {
  id: number
  classId: number
  classTitle: string
  studentId: number
  studentName: string | null
  studentEmail: string | null
  studentPhone: string | null
  studentAvatar: string | null
  status: EnrollmentStatus
  note: string | null
  approvedAt: string | null
  paidAt: string | null
  createdAt: string
  orderId: number | null
  amount: number | null
}

export async function getEnrollmentsOfClass(
  classId: number,
  page = 0,
  size = 20
): Promise<PageResponse<EnrollmentResponse>> {
  const res = await api.get(`/api/classes/my/${classId}/enrollments`, {
    headers: getAuthHeader(),
    params: { page, size },
  })
  return res.data
}

export async function getMyEnrollments(page = 0, size = 50): Promise<PageResponse<EnrollmentResponse>> {
  const res = await api.get('/api/classes/my-enrollments', {
    headers: getAuthHeader(),
    params: { page, size },
  })
  return res.data
}

export async function reviewEnrollment(
  enrollmentId: number,
  approved: boolean,
  note?: string
): Promise<EnrollmentResponse> {
  const res = await api.put(`/api/classes/enrollments/${enrollmentId}/review`, { approved, note }, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function adminGetAllClasses(
  approvalStatus: ApprovalStatus | null,
  page = 0,
  size = 10
): Promise<PageResponse<ClassResponse>> {
  const params: Record<string, unknown> = { page, size }
  if (approvalStatus) params.approvalStatus = approvalStatus
  const res = await api.get('/api/classes/admin/all', {
    headers: getAuthHeader(),
    params,
  })
  return res.data
}

export async function adminGetClassDetail(classId: number): Promise<ClassResponse> {
  const res = await api.get(`/api/classes/admin/${classId}`, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function adminGetClassEnrollments(
  classId: number,
  page = 0,
  size = 50
): Promise<PageResponse<EnrollmentResponse>> {
  const res = await api.get(`/api/classes/admin/${classId}/enrollments`, {
    headers: getAuthHeader(),
    params: { page, size },
  })
  return res.data
}

export async function adminReviewClass(
  classId: number,
  approved: boolean,
  rejectReason?: string
): Promise<ClassResponse> {
  const res = await api.put(`/api/classes/admin/${classId}/review`, { approved, rejectReason }, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function enroll(classId: number, voucherId?: number): Promise<EnrollmentResponse> {
  const params: Record<string, unknown> = {}
  if (voucherId) params.voucherId = voucherId
  const res = await api.post(`/api/classes/${classId}/enroll`, null, {
    headers: getAuthHeader(),
    params,
  })
  return res.data
}

export async function confirmPayment(enrollmentId: number): Promise<EnrollmentResponse> {
  const res = await api.post(`/api/classes/enrollments/${enrollmentId}/pay`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function requestCashPayment(enrollmentId: number): Promise<EnrollmentResponse> {
  const res = await api.post(`/api/classes/enrollments/${enrollmentId}/request-cash`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function confirmCashReceived(enrollmentId: number): Promise<EnrollmentResponse> {
  const res = await api.post(`/api/classes/enrollments/${enrollmentId}/confirm-cash`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}
