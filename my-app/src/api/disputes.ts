import api from './axios'
import type {
  AdminDispute,
  DisputePriority,
  PageResponse,
} from './admin'

export interface DisputeCreatePayload {
  classId?: number | null
  respondentId?: number | null
  reason: string
  description: string
  amount?: number | null
  priority?: DisputePriority
}

export async function createDispute(payload: DisputeCreatePayload): Promise<AdminDispute> {
  const res = await api.post('/api/disputes', payload)
  return res.data
}

export async function getMyDisputes(params: {
  page?: number
  size?: number
} = {}): Promise<PageResponse<AdminDispute>> {
  const res = await api.get('/api/disputes/my', { params })
  return res.data
}

export async function getMyDispute(disputeId: number): Promise<AdminDispute> {
  const res = await api.get(`/api/disputes/${disputeId}`)
  return res.data
}
