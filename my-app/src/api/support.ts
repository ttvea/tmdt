import api from './axios'

export type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED'
export type SupportCategory = 'ACCOUNT' | 'TUTOR_PROFILE' | 'VERIFICATION' | 'CLASS' | 'PAYMENT' | 'VOUCHER' | 'REPORT' | 'OTHER'
export type SupportPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface SupportReply {
  id: number
  senderId: number
  senderName: string
  senderRole: string | null
  adminReply: boolean
  message: string
  createdAt: string | null
}

export interface SupportTicket {
  id: number
  ticketCode: string
  requesterId: number
  requesterName: string
  requesterEmail: string
  requesterRole: string | null
  requesterAvatar: string | null
  subject: string
  category: SupportCategory
  priority: SupportPriority
  status: SupportStatus
  message: string
  assignedAdminId: number | null
  assignedAdminName: string | null
  createdAt: string | null
  updatedAt: string | null
  resolvedAt: string | null
  replies: SupportReply[]
}

export interface SupportTicketPayload {
  subject: string
  category: SupportCategory
  priority: SupportPriority
  message: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export async function createSupportTicket(payload: SupportTicketPayload): Promise<SupportTicket> {
  const res = await api.post('/api/support/tickets', payload)
  return res.data
}

export async function getMySupportTickets(params: {
  page?: number
  size?: number
} = {}): Promise<PageResponse<SupportTicket>> {
  const res = await api.get('/api/support/my-tickets', { params })
  return res.data
}

export async function getMySupportTicket(ticketId: number): Promise<SupportTicket> {
  const res = await api.get(`/api/support/tickets/${ticketId}`)
  return res.data
}

export async function replyMySupportTicket(ticketId: number, message: string): Promise<SupportTicket> {
  const res = await api.post(`/api/support/tickets/${ticketId}/replies`, { message })
  return res.data
}
