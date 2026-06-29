import api from './axios'

function getAuthHeader() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface RefundResponse {
  id: number
  orderId: number
  studentId: number
  tutorId: number
  amount: number
  disputeId: number | null
  reason: string
  status: 'PENDING_REFUND' | 'TUTOR_PAID' | 'COMPLETED'
  vnpTxnRef: string | null
  vnpTransactionNo: string | null
  vnpResponseCode: string | null
  paymentUrl: string | null
  tutorPaidAt: string | null
  completedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export async function getAdminRefunds(status?: string): Promise<RefundResponse[]> {
  const params: Record<string, string> = {}
  if (status) params.status = status
  const res = await api.get('/api/admin/refunds', {
    headers: getAuthHeader(),
    params,
  })
  return res.data
}

export async function createRefund(data: {
  orderId: number
  amount: number
  reason: string
  disputeId?: number | null
}): Promise<RefundResponse> {
  const res = await api.post('/api/admin/refunds', data, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function createTutorPaymentUrl(refundId: number): Promise<RefundResponse> {
  const res = await api.post(`/api/admin/refunds/${refundId}/payment-url`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function completeRefund(refundId: number): Promise<RefundResponse> {
  const res = await api.post(`/api/admin/refunds/${refundId}/complete`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function getStudentRefunds(): Promise<RefundResponse[]> {
  const res = await api.get('/api/student/refunds', {
    headers: getAuthHeader(),
  })
  return res.data
}

export async function getTutorRefunds(): Promise<RefundResponse[]> {
  const res = await api.get('/api/tutor/refunds', {
    headers: getAuthHeader(),
  })
  return res.data
}

export const REFUND_STATUS_LABELS: Record<string, string> = {
  PENDING_REFUND: 'Chờ tutor thanh toán',
  TUTOR_PAID: 'Tutor đã thanh toán',
  COMPLETED: 'Đã hoàn tiền',
}

export const REFUND_REASON_LABELS: Record<string, string> = {
  QUALITY: 'Chất lượng không đảm bảo',
  TUTOR_CANCEL: 'Gia sư hủy lớp',
  STUDENT_CANCEL: 'Học viên hủy',
  NO_SHOW: 'Gia sư không dạy',
  OTHER: 'Khác',
}