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
