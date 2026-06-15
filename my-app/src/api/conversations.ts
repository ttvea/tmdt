import api, { getMediaUrl } from './axios'

export interface ConversationResponse {
  conversationId: number
  otherUserId: number
  otherUserName: string
  otherUserAvatar: string
  lastMessage: string
  lastMessageTime: string
}

export interface MessageResponse {
  id: number
  senderId: number
  senderName: string
  senderAvatar: string
  content: string | null
  imageUrl: string | null
  isRead: boolean
  createdAt: string
}

type RawMessageResponse = {
  id?: number
  conversationId?: number
  conversation_id?: number
  senderId?: number
  sender_id?: number
  senderName?: string
  sender_name?: string
  senderAvatar?: string
  sender_avatar?: string
  content?: string | null
  imageUrl?: string | null
  image_url?: string | null
  isRead?: boolean | null
  is_read?: boolean | null
  createdAt?: string
  created_at?: string
}

export interface SendMessageRequest {
  conversationId: number
  content: string
}

export interface CreateConversationRequest {
  tutorId?: number
  studentId?: number
}

/**
 * Fetch list of conversations for the current user (tutor/student)
 */
export async function getConversationsList(): Promise<ConversationResponse[]> {
  try {
    const response = await api.get('/api/conversations')
    return response.data || []
  } catch (error) {
    console.error('Failed to fetch conversations list:', error)
    throw error
  }
}

/**
 * Get or create a conversation with a tutor (student) or student (tutor)
 */
export async function createOrGetConversation(params: CreateConversationRequest): Promise<number> {
  try {
    const response = await api.post('/api/conversations', params)
    return response.data
  } catch (error) {
    console.error('Failed to create/get conversation:', error)
    throw error
  }
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: number,
  content: string
): Promise<number> {
  try {
    const response = await api.post('/api/messages', {
      conversationId,
      content,
    })
    return response.data
  } catch (error) {
    console.error('Failed to send message:', error)
    throw error
  }
}

export async function sendImageMessage(
  conversationId: number,
  file: File
): Promise<any> {
  try {
    const form = new FormData()
    form.append('conversationId', String(conversationId))
    form.append('file', file)

    const response = await api.post('/api/messages/image', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    // console.log('Image message sent successfully:', response.data)
    return response.data
  } catch (error) {
    console.error('Failed to send image message:', error)
    throw error
  }
}

/**
 * Fetch messages for a specific conversation
 */
export async function getConversationMessages(
  conversationId: number
): Promise<MessageResponse[]> {
  try {
    const response = await api.get(`/api/messages/${conversationId}/messages`)
    const messages = Array.isArray(response.data) ? response.data : []

    return messages.map((message: RawMessageResponse) => ({
      id: message.id ?? 0,
      senderId: message.senderId ?? message.sender_id ?? 0,
      senderName: message.senderName ?? message.sender_name ?? '',
      senderAvatar: message.senderAvatar ?? message.sender_avatar ?? '',
      content: message.content ?? null,
      imageUrl: message.imageUrl ?? message.image_url ?? null,
      isRead: message.isRead ?? message.is_read ?? false,
      createdAt: message.createdAt ?? message.created_at ?? '',
    }))
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    throw error
  }
}

export function getMessageMediaUrl(message: MessageResponse): string | null {
  const imageUrl = message.imageUrl?.trim()
  if (imageUrl) {
    return getMediaUrl(imageUrl)
  }

  const directContent = message.content?.trim()
  if (directContent) {
    if (directContent.startsWith('http://') || directContent.startsWith('https://')) {
      return directContent
    }

    if (/\.(jpg|jpeg|png|gif|webp|bmp)($|\?)/i.test(directContent)) {
      return getMediaUrl(directContent)
    }
  }

  return null
}

export function isImageMessage(message: MessageResponse): boolean {
  return Boolean(getMessageMediaUrl(message))
}
