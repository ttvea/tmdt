import api from './axios'

function getAuthHeader() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface VoucherResponse {
  id: number
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  minPrice: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  applicableScope: 'PLATFORM' | 'ALL_CLASSES' | 'SPECIFIC_CLASS'
  classId: number | null
  tutorName: string | null
  active: boolean
  startDate: string | null
  endDate: string | null
}

/**
 * Lấy danh sách voucher khả dụng cho học viên
 */
export async function getAvailableVouchers(classId?: number): Promise<VoucherResponse[]> {
  const res = await api.get('/api/vouchers/available', {
    headers: getAuthHeader(),
    params: classId ? { classId } : undefined,
  })
  return res.data
}

/**
 * Lấy danh sách voucher đang active của một gia sư (trang hồ sơ gia sư)
 */
export async function getTutorVouchers(tutorUserId: number): Promise<VoucherResponse[]> {
  const res = await api.get(`/api/vouchers/tutor/${tutorUserId}`)
  return res.data
}

/**
 * Nhận voucher - học viên claim một voucher từ gia sư
 */
export async function claimVoucher(voucherId: number): Promise<VoucherResponse> {
  const res = await api.post(`/api/vouchers/${voucherId}/claim`, null, {
    headers: getAuthHeader(),
  })
  return res.data
}
