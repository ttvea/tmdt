import api from './axios'

function getAuthHeader() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface FeeSummary {
  totalPendingFee: number
  pendingCount: number
}

export interface PendingFeeItem {
  id: number
  orderId: number
  amount: number
  status: 'PENDING' | 'PAID' | 'FAILED'
  paymentUrl: string | null
  createdAt: string
}

export interface FeeHistoryItem {
  id: number
  orderId: number
  amount: number
  status: 'PENDING' | 'PAID' | 'FAILED'
  vnpTransactionNo: string | null
  paidAt: string | null
  createdAt: string
}

export interface PayFeeResponse {
  paymentUrl: string
}

/**
 * Lấy tổng phí nền tảng chưa thanh toán
 */
export async function getFeeSummary(): Promise<FeeSummary> {
  const res = await api.get('/api/tutor/platform-fee/summary', {
    headers: getAuthHeader(),
  })
  return res.data
}

/**
 * Lấy danh sách phí nền tảng chưa thanh toán
 */
export async function getPendingFees(): Promise<PendingFeeItem[]> {
  const res = await api.get('/api/tutor/platform-fee/pending', {
    headers: getAuthHeader(),
  })
  return res.data
}

/**
 * Lấy lịch sử thanh toán phí nền tảng
 */
export async function getFeeHistory(): Promise<FeeHistoryItem[]> {
  const res = await api.get('/api/tutor/platform-fee/history', {
    headers: getAuthHeader(),
  })
  return res.data
}

/**
 * Tạo VNPAY URL để thanh toán phí nền tảng
 */
export async function payPlatformFee(feePaymentId: number): Promise<PayFeeResponse> {
  const res = await api.post(`/api/tutor/platform-fee/pay/${feePaymentId}`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}