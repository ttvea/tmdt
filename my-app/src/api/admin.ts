import api from './axios'

export interface AdminSession {
  id: number
  email: string
  fullName: string
  role: string
  avatar: string | null
}

export interface AdminDashboardStats {
  totalRevenue: number
  totalUsers: number
  newUsersThisWeek: number
  totalTutors: number
  verifiedTutors: number
  pendingClasses: number
  totalClasses: number
  openClasses: number
  teachingClasses: number
  completedClasses: number
  totalEnrollments: number
  pendingEnrollments: number
  paidEnrollments: number
}

export type AdminUserRole = 'STUDENT' | 'TUTOR' | 'ADMIN'
export type AdminUserGender = 'MALE' | 'FEMALE'

export interface AdminUser {
  id: number
  fullName: string
  email: string
  phone: string | null
  avatar: string | null
  role: AdminUserRole | null
  enabled: boolean | null
  verified: boolean | null
  createdAt: string | null
  updatedAt: string | null
}

export interface AdminTutor {
  id: number
  userId: number
  profileId: number | null
  fullName: string
  email: string
  avatar: string | null
  major: string | null
  experience: string | null
  isVerified: boolean
  enabled: boolean | null
  hasProfile: boolean
  subjects: string[]
}

export type DiscountType = 'PERCENT' | 'FIXED'
export type VoucherScope = 'PLATFORM' | 'ALL_CLASSES' | 'SPECIFIC_CLASS'
export type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED'
export type SupportCategory = 'ACCOUNT' | 'TUTOR_PROFILE' | 'VERIFICATION' | 'CLASS' | 'PAYMENT' | 'VOUCHER' | 'REPORT' | 'OTHER'
export type SupportPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type DisputeStatus = 'PENDING' | 'REVIEWING' | 'NEED_EVIDENCE' | 'RESOLVED' | 'REFUNDED' | 'REJECTED' | 'CLOSED'
export type DisputePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type DisputeResolutionType = 'NONE' | 'FULL_REFUND' | 'PARTIAL_REFUND' | 'MAKE_UP_CLASS' | 'WARNING' | 'REJECTED'
export type AdminReportType = 'DASHBOARD' | 'DISPUTES' | 'USERS' | 'TUTORS'

export interface AdminReportMetric {
  label: string
  value: number
  detail: string
}

export interface AdminReportChartPoint {
  label: string
  value: number
}

export interface AdminReportRow {
  code: string
  date: string | null
  tutorName: string | null
  studentName: string | null
  amount: number
}

export interface AdminReportPreview {
  metrics: AdminReportMetric[]
  chart: AdminReportChartPoint[]
  rows: AdminReportRow[]
}

export interface AdminProfileSettings {
  id?: number
  fullName: string
  email: string
  phone: string
  avatar: string
  role?: string | null
  currentPassword?: string
  newPassword?: string
}

export interface AdminPlatformSettings {
  siteName: string
  brandName: string
  logoUrl: string
  faviconUrl: string
  hotline: string
  supportEmail: string
  officeAddress: string
  workingHours: string
  zaloUrl: string
  messengerUrl: string
  facebookUrl: string
}

export interface AdminApprovalSettings {
  requireTutorVerification: boolean
  tutorMustBeVerifiedToOpenClass: boolean
  requiredTutorDocuments: string
  tutorApprovedMessage: string
  tutorRejectedMessage: string
  requireClassApproval: boolean
  maxClassesForUnverifiedTutor: number
  autoCloseClassAfterDays: number
}

export interface AdminSupportDisputeSettings {
  supportSlaHours: number
  supportCategories: string
  disputeReasons: string
  evidenceDeadlineHours: number
  defaultRefundPolicy: string
  needEvidenceMessage: string
  disputeResolvedMessage: string
}

export interface AdminSettings {
  profile: AdminProfileSettings
  platform: AdminPlatformSettings
  approval: AdminApprovalSettings
  supportDisputes: AdminSupportDisputeSettings
}

export interface AdminVoucher {
  id: number
  code: string
  discountType: DiscountType
  discountValue: number
  minPrice: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number | null
  applicableScope: VoucherScope
  classId: number | null
  active: boolean
  startDate: string | null
  endDate: string | null
}

export interface AdminVoucherPayload {
  code: string
  discountType: DiscountType
  discountValue: number
  minPrice?: number | null
  maxDiscount?: number | null
  usageLimit?: number | null
  applicableScope?: VoucherScope
  startDate?: string | null
  endDate?: string | null
}

export interface SupportReply {
  id: number
  senderId: number
  senderName: string
  senderRole: AdminUserRole | string | null
  adminReply: boolean
  message: string
  createdAt: string | null
}

export interface SupportTicket {
  id: number
  ticketCode: string
  requesterId: number
  requesterName: string
  requesterEmail: string
  requesterRole: AdminUserRole | string | null
  requesterAvatar: string | null
  subject: string
  category: SupportCategory
  priority: SupportPriority
  status: SupportStatus
  message: string
  assignedAdminId: number | null
  assignedAdminName: string | null
  createdAt: string | null
  updatedAt: string | null
  resolvedAt: string | null
  replies: SupportReply[]
}

export interface AdminSupportStats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  waitingUserTickets: number
  resolvedTickets: number
  closedTickets: number
  urgentTickets: number
}

export interface DisputeNote {
  id: number
  adminId: number
  adminName: string
  note: string
  createdAt: string | null
}

export interface DisputeEvidence {
  id: number
  uploadedById: number
  uploadedByName: string
  uploadedByRole: AdminUserRole | string | null
  note: string | null
  fileUrl: string | null
  fileType: string | null
  createdAt: string | null
}

export interface AdminDispute {
  id: number
  caseCode: string
  classId: number | null
  classTitle: string | null
  studentId: number | null
  studentName: string | null
  tutorId: number | null
  tutorName: string | null
  createdById: number
  createdByName: string
  reason: string
  description: string
  amount: number | null
  status: DisputeStatus
  priority: DisputePriority
  resolutionType: DisputeResolutionType
  resolutionNote: string | null
  resolvedByAdminId: number | null
  resolvedByAdminName: string | null
  createdAt: string | null
  updatedAt: string | null
  resolvedAt: string | null
  notes: DisputeNote[]
  evidences: DisputeEvidence[]
}

export interface AdminDisputeStats {
  totalDisputes: number
  activeDisputes: number
  pendingDisputes: number
  resolvedDisputes: number
  refundedDisputes: number
  rejectedDisputes: number
  activeAmount: number
  successRate: number
}

export interface AdminUsersStats {
  totalUsers: number
  totalStudents: number
  totalTutors: number
  totalAdmins: number
  activeUsers: number
  lockedUsers: number
  newUsersThisWeek: number
}

export interface AdminCreateUserPayload {
  fullName: string
  email: string
  password: string
  role: AdminUserRole
  enabled: boolean
  phone?: string
  avatar?: string
  gender?: AdminUserGender
  birthday?: number
  sendWelcomeEmail?: boolean
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function getAuthHeader(token?: string | null) {
  const accessToken = token ?? localStorage.getItem('access_token')
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

export async function getCurrentAdmin(token?: string | null): Promise<AdminSession> {
  const res = await api.get('/api/admin/me', {
    headers: getAuthHeader(token),
  })
  return res.data
}

export async function getAdminDashboard(token?: string | null): Promise<AdminDashboardStats> {
  const res = await api.get('/api/admin/dashboard', {
    headers: getAuthHeader(token),
  })
  return res.data
}

export async function getAdminUsers(params: {
  role?: AdminUserRole | ''
  enabled?: boolean | ''
  keyword?: string
  page?: number
  size?: number
}): Promise<PageResponse<AdminUser>> {
  const cleanParams = {
    ...params,
    role: params.role || undefined,
    enabled: params.enabled === '' ? undefined : params.enabled,
    keyword: params.keyword?.trim() || undefined,
  }
  const res = await api.get('/api/admin/users', { params: cleanParams })
  return res.data
}

export async function getAdminUsersStats(): Promise<AdminUsersStats> {
  const res = await api.get('/api/admin/users/stats')
  return res.data
}

export async function getAdminTutors(params: {
  keyword?: string
  page?: number
  size?: number
}): Promise<PageResponse<AdminTutor>> {
  const cleanParams = {
    ...params,
    keyword: params.keyword?.trim() || undefined,
  }
  const res = await api.get('/api/admin/tutors', { params: cleanParams })
  return res.data
}

export async function updateAdminTutorVerification(userId: number, verified: boolean): Promise<AdminTutor> {
  const res = await api.patch(`/api/admin/tutors/${userId}/verification`, { verified })
  return res.data
}

export async function getAdminVouchers(params: {
  page?: number
  size?: number
} = {}): Promise<PageResponse<AdminVoucher>> {
  const res = await api.get('/api/admin/vouchers', { params })
  return res.data
}

export async function createAdminVoucher(payload: AdminVoucherPayload): Promise<AdminVoucher> {
  const res = await api.post('/api/admin/vouchers', {
    ...payload,
    applicableScope: 'PLATFORM',
  })
  return res.data
}

export async function updateAdminVoucher(voucherId: number, payload: AdminVoucherPayload): Promise<AdminVoucher> {
  const res = await api.put(`/api/admin/vouchers/${voucherId}`, {
    ...payload,
    applicableScope: 'PLATFORM',
  })
  return res.data
}

export async function updateAdminVoucherStatus(voucherId: number, active: boolean): Promise<AdminVoucher> {
  const res = await api.patch(`/api/admin/vouchers/${voucherId}/status`, null, {
    params: { active },
  })
  return res.data
}

export async function getAdminSupportStats(): Promise<AdminSupportStats> {
  const res = await api.get('/api/admin/support/stats')
  return res.data
}

export async function getAdminSupportTickets(params: {
  status?: SupportStatus | ''
  category?: SupportCategory | ''
  priority?: SupportPriority | ''
  keyword?: string
  page?: number
  size?: number
}): Promise<PageResponse<SupportTicket>> {
  const cleanParams = {
    ...params,
    status: params.status || undefined,
    category: params.category || undefined,
    priority: params.priority || undefined,
    keyword: params.keyword?.trim() || undefined,
  }
  const res = await api.get('/api/admin/support/tickets', { params: cleanParams })
  return res.data
}

export async function getAdminSupportTicket(ticketId: number): Promise<SupportTicket> {
  const res = await api.get(`/api/admin/support/tickets/${ticketId}`)
  return res.data
}

export async function updateAdminSupportTicketStatus(ticketId: number, status: SupportStatus): Promise<SupportTicket> {
  const res = await api.patch(`/api/admin/support/tickets/${ticketId}/status`, { status })
  return res.data
}

export async function replyAdminSupportTicket(ticketId: number, message: string): Promise<SupportTicket> {
  const res = await api.post(`/api/admin/support/tickets/${ticketId}/replies`, { message })
  return res.data
}

export async function getAdminDisputeStats(): Promise<AdminDisputeStats> {
  const res = await api.get('/api/admin/disputes/stats')
  return res.data
}

export async function getAdminDisputes(params: {
  status?: DisputeStatus | ''
  priority?: DisputePriority | ''
  keyword?: string
  page?: number
  size?: number
}): Promise<PageResponse<AdminDispute>> {
  const cleanParams = {
    ...params,
    status: params.status || undefined,
    priority: params.priority || undefined,
    keyword: params.keyword?.trim() || undefined,
  }
  const res = await api.get('/api/admin/disputes', { params: cleanParams })
  return res.data
}

export async function getAdminDispute(disputeId: number): Promise<AdminDispute> {
  const res = await api.get(`/api/admin/disputes/${disputeId}`)
  return res.data
}

export async function resolveAdminDispute(disputeId: number, payload: {
  status: DisputeStatus
  resolutionType: DisputeResolutionType
  resolutionNote?: string | null
}): Promise<AdminDispute> {
  const res = await api.patch(`/api/admin/disputes/${disputeId}/resolve`, payload)
  return res.data
}

export async function addAdminDisputeNote(disputeId: number, note: string): Promise<AdminDispute> {
  const res = await api.post(`/api/admin/disputes/${disputeId}/notes`, { note })
  return res.data
}

export async function exportAdminReport(params: {
  type: AdminReportType
  from?: string
  to?: string
  format?: 'CSV' | 'PDF'
}): Promise<Blob> {
  const res = await api.get('/api/admin/reports/export', {
    params,
    responseType: 'blob',
  })
  return res.data
}

export async function getAdminReportPreview(params: {
  type: AdminReportType
  from?: string
  to?: string
}): Promise<AdminReportPreview> {
  const res = await api.get('/api/admin/reports/preview', { params })
  return res.data
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const res = await api.get('/api/admin/settings')
  return res.data
}

export async function updateAdminProfileSettings(payload: AdminProfileSettings): Promise<AdminProfileSettings> {
  const res = await api.put('/api/admin/settings/profile', payload)
  return res.data
}

export async function updateAdminPlatformSettings(payload: AdminPlatformSettings): Promise<AdminSettings> {
  const res = await api.put('/api/admin/settings/platform', payload)
  return res.data
}

export async function updateAdminApprovalSettings(payload: AdminApprovalSettings): Promise<AdminSettings> {
  const res = await api.put('/api/admin/settings/approval', payload)
  return res.data
}

export async function updateAdminSupportDisputeSettings(payload: AdminSupportDisputeSettings): Promise<AdminSettings> {
  const res = await api.put('/api/admin/settings/support-disputes', payload)
  return res.data
}

export async function uploadAdminSettingsAsset(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/api/admin/settings/assets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

export async function updateAdminUserStatus(userId: number, enabled: boolean): Promise<AdminUser> {
  const res = await api.patch(`/api/admin/users/${userId}/status`, { enabled })
  return res.data
}

export async function updateAdminUserRole(userId: number, role: AdminUserRole): Promise<AdminUser> {
  const res = await api.patch(`/api/admin/users/${userId}/role`, { role })
  return res.data
}

export async function createAdminUser(payload: AdminCreateUserPayload): Promise<AdminUser> {
  const res = await api.post('/api/admin/users', payload)
  return res.data
}

export async function uploadAdminUserAvatar(userId: number, file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post(`/api/users/${userId}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

export async function logoutAdmin(token?: string | null): Promise<void> {
  await api.post('/api/auth/logout', null, {
    headers: getAuthHeader(token),
  })
}
