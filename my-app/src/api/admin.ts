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

export interface AdminUsersStats {
  totalUsers: number
  totalStudents: number
  totalTutors: number
  totalAdmins: number
  activeUsers: number
  lockedUsers: number
  newUsersThisWeek: number
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

export async function updateAdminUserStatus(userId: number, enabled: boolean): Promise<AdminUser> {
  const res = await api.patch(`/api/admin/users/${userId}/status`, { enabled })
  return res.data
}

export async function updateAdminUserRole(userId: number, role: AdminUserRole): Promise<AdminUser> {
  const res = await api.patch(`/api/admin/users/${userId}/role`, { role })
  return res.data
}

export async function logoutAdmin(token?: string | null): Promise<void> {
  await api.post('/api/auth/logout', null, {
    headers: getAuthHeader(token),
  })
}
