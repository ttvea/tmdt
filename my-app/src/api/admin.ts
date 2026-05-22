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

export async function logoutAdmin(token?: string | null): Promise<void> {
  await api.post('/api/auth/logout', null, {
    headers: getAuthHeader(token),
  })
}
