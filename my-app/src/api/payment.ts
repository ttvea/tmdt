import api from './axios'

function getAuthHeader() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface CreatePaymentResponse {
  paymentUrl: string
}

/**
 * Tạo VNPAY payment URL cho order
 */
export async function createPayment(orderId: number): Promise<CreatePaymentResponse> {
  const res = await api.post('/api/payment/create', null, {
    headers: getAuthHeader(),
    params: { orderId },
  })
  return res.data
}