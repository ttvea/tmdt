import api from './axios'

export type DiscountType = 'PERCENT' | 'FIXED'
export type VoucherScope = 'ALL_CLASSES' | 'SPECIFIC_CLASS'

export interface VoucherRequest {
  code: string
  discountType: DiscountType
  discountValue: number
  minPrice?: number | null
  maxDiscount?: number | null
  usageLimit?: number | null
  applicableScope: VoucherScope
  classId?: number | null
  startDate?: string | null
  endDate?: string | null
}

export interface VoucherResponse {
  id: number
  code: string
  discountType: DiscountType
  discountValue: number
  minPrice: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  applicableScope: VoucherScope
  classId: number | null
  active: boolean
  startDate: string | null
  endDate: string | null
}

export async function getMyVouchers(): Promise<VoucherResponse[]> {
  const res = await api.get('/api/vouchers/my')
  return res.data
}

export async function createVoucher(request: VoucherRequest): Promise<VoucherResponse> {
  const res = await api.post('/api/vouchers', request)
  return res.data
}

export async function updateVoucher(voucherId: number, request: VoucherRequest): Promise<VoucherResponse> {
  const res = await api.put(`/api/vouchers/${voucherId}`, request)
  return res.data
}

export async function updateVoucherStatus(voucherId: number, active: boolean): Promise<VoucherResponse> {
  const res = await api.patch(`/api/vouchers/${voucherId}/status`, null, {
    params: { active },
  })
  return res.data
}

export async function deleteVoucher(voucherId: number): Promise<void> {
  await api.delete(`/api/vouchers/${voucherId}`)
}
