import api from './axios'

function getAuthHeader() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface PayoutRequest {
  amount: number
  note?: string
  bankName: string
  bankAccount: string
  bankHolder: string
}

export interface PayoutHistoryItem {
  id: number
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  note: string | null
  bankName: string | null
  bankAccount: string | null
  bankHolder: string | null
  createdAt: string
  completedAt: string | null
}

export interface BalanceInfo {
  availableBalance: number
  pendingPayoutAmount: number
  withdrawableBalance: number
  totalPaidOut: number
}

export interface PendingOrder {
  id: number
  studentId: number
  className: string
  amount: number
  tutorEarning: number
  tutorPayoutPaidAmount?: number
  tutorPayoutRemainingAmount?: number
  platformFee: number
  paidAt: string | null
}

/**
 * Lấy số dư khả dụng và tổng đã rút của gia sư
 */
export async function getTutorBalance(): Promise<BalanceInfo> {
  const res = await api.get('/api/tutor/payout/balance', {
    headers: getAuthHeader(),
  })
  return res.data
}

/**
 * Gửi yêu cầu rút tiền
 */
export async function requestPayout(data: PayoutRequest) {
  const res = await api.post('/api/tutor/payout/request', data, {
    headers: getAuthHeader(),
  })
  return res.data
}

/**
 * Lấy lịch sử rút tiền
 */
export async function getPayoutHistory(): Promise<PayoutHistoryItem[]> {
  const res = await api.get('/api/tutor/payout/history', {
    headers: getAuthHeader(),
  })
  return res.data
}

/**
 * Lấy danh sách order chờ payout
 */
export async function getPendingOrders(): Promise<PendingOrder[]> {
  const res = await api.get('/api/tutor/payout/pending-orders', {
    headers: getAuthHeader(),
  })
  return res.data
}

// ======================== ADMIN APIs ========================

export interface AdminPayoutItem {
  id: number
  tutorId: number
  tutorName: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  note: string | null
  paymentMethod: string | null
  providerTransactionId: string | null
  providerNote: string | null
  bankName: string | null
  bankAccount: string | null
  bankHolder: string | null
  createdAt: string
  completedAt: string | null
}

/**
 * Admin: Lấy tất cả yêu cầu payout
 */
export async function getAllPayouts(status?: string): Promise<AdminPayoutItem[]> {
  const params: any = {}
  if (status) params.status = status
  const res = await api.get('/api/admin/payouts', {
    headers: getAuthHeader(),
    params,
  })
  return res.data
}

/**
 * Admin: Duyệt payout
 */
export interface ApprovePayoutPayload {
  note?: string
  paymentMethod?: 'bank_transfer' | 'vnpay_transfer'
  providerTransactionId?: string
  providerNote?: string
}

export async function approvePayout(payoutId: number, payload?: ApprovePayoutPayload) {
  const res = await api.post(
    `/api/admin/payouts/${payoutId}/approve`,
    payload || {},
    { headers: getAuthHeader() }
  )
  return res.data
}

/**
 * Admin: Từ chối payout
 */
export async function rejectPayout(payoutId: number, reason: string) {
  const res = await api.post(
    `/api/admin/payouts/${payoutId}/reject`,
    { reason },
    { headers: getAuthHeader() }
  )
  return res.data
}
