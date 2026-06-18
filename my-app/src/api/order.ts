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
