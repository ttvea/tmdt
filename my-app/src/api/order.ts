import api from './axios'

function getAuthHeader() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface OrderResponse {
  id: number
  studentId: number
  classId: number
  className: string
  amount: number
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED'
  vnpTxnRef: string | null
  vnpTransactionNo: string | null
  vnpResponseCode: string | null
  paymentUrl: string | null
  dateCreate: string
  paidAt: string | null
}

export interface OrderDetailResponse {
  id: number
  amount: number
  status: string
  dateCreate: string
  dateUpdate: string | null
  paidAt: string | null

  // Lớp học
  classId: number
  className: string
  classDescription: string | null
  tutorName: string | null
  tutorEmail: string | null
  tutorPhone: string | null
  tutorAvatar: string | null

  // Học viên
  studentId: number
  studentName: string | null
  studentEmail: string | null
  studentPhone: string | null
  studentAvatar: string | null

  // VNPAY
  vnpTxnRef: string | null
  vnpTransactionNo: string | null
  vnpResponseCode: string | null
  paymentUrl: string | null

  // Thanh toán
  paymentProvider: string | null
  paymentStatus: string | null
  transactionId: string | null

  // Enrollments
  enrollments: {
    id: number
    status: string
    approvedAt: string | null
    paidAt: string | null
  }[]
}

export async function getOrdersByClass(classId: number): Promise<OrderResponse[]> {
  const res = await api.get(`/api/classes/${classId}/orders`, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function getMyOrders(): Promise<OrderResponse[]> {
  const res = await api.get('/api/orders/my', {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function getOrderDetail(orderId: number): Promise<OrderDetailResponse> {
  const res = await api.get(`/api/orders/${orderId}`, {
    headers: getAuthHeader(),
  })
  return res.data
}

export interface TutorRevenueResponse {
  totalOrders: number
  totalAmount: number
  totalPlatformFee: number
  totalTutorEarning: number
  fromDate: string | null
  toDate: string | null
}

export interface MonthlyRevenueItem {
  month: string
  totalAmount: number
  platformFee: number
  tutorEarning: number
  orderCount: number
}

export async function getTutorRevenue(
  tutorId: number,
  fromDate?: string,
  toDate?: string
): Promise<TutorRevenueResponse> {
  const params: Record<string, string> = {}
  if (fromDate) params.fromDate = fromDate
  if (toDate) params.toDate = toDate
  const res = await api.get(`/api/tutor/${tutorId}/revenue`, {
    headers: getAuthHeader(),
    params,
  })
  return res.data
}

/**
 * API mới: Lấy doanh thu theo từng tháng để vẽ biểu đồ cột
 */
export async function getTutorRevenueMonthly(
  tutorId: number,
  fromDate?: string,
  toDate?: string
): Promise<MonthlyRevenueItem[]> {
  const params: Record<string, string> = {}
  if (fromDate) params.fromDate = fromDate
  if (toDate) params.toDate = toDate
  const res = await api.get(`/api/tutor/${tutorId}/revenue/monthly`, {
    headers: getAuthHeader(),
    params,
  })
  return res.data
}