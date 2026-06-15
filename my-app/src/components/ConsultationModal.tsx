﻿import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { getConversationMessages, sendMessage, sendImageMessage, getMessageMediaUrl, isImageMessage, type MessageResponse } from '../api/conversations'
import { supabase } from '../api/supabase'

interface ConsultationModalProps {
  isOpen: boolean
  tutorName: string
  tutorAvatar?: string
  conversationId: number | null
  onClose: () => void
}

export function ConsultationModal({
  isOpen,
  tutorName,
  tutorAvatar,
  conversationId,
  onClose,
}: ConsultationModalProps) {
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUserId(user.id)
        console.log('[ConsultationModal] currentUserId:', user.id)
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !conversationId) return

    const fetchMessages = async () => {
      try {
        setLoading(true)
        setError('')
        console.log('[ConsultationModal] Fetching messages for conversation:', conversationId)
        const data = await getConversationMessages(conversationId)
        console.log('[ConsultationModal] Loaded messages count:', data.length)
        setMessages(data)
      } catch (err) {
        console.error('Failed to load consultation messages:', err)
        setError('Không thể tải lịch sử tin nhắn')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [isOpen, conversationId])

  useEffect(() => {
    if (!supabase || !isOpen || !conversationId) {
      console.log('[ConsultationModal] Supabase not available or modal closed', { hasSupabase: !!supabase, isOpen, conversationId })
      return
    }

    console.log('[ConsultationModal] Setting up Supabase realtime channel for conversation:', conversationId)

    const channel = supabase
      .channel('msg-changes-modal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        console.log('[ConsultationModal] ===== REALTIME PAYLOAD RECEIVED =====')
        console.log('[ConsultationModal] Full payload:', JSON.stringify(payload, null, 2))
        console.log('[ConsultationModal] payload.new:', JSON.stringify(payload?.new))
        console.log('[ConsultationModal] payload.old:', JSON.stringify(payload?.old))
        console.log('[ConsultationModal] payload.eventType:', payload?.eventType)

        // Log tất cả các key có trong payload.new để debug
        if (payload?.new) {
          console.log('[ConsultationModal] Keys in payload.new:', Object.keys(payload.new))
        }

        const changedConversationId = Number(
          payload?.new?.conversation_id ?? payload?.old?.conversation_id
        )
        console.log('[ConsultationModal] Changed conversationId:', changedConversationId, '(type:', typeof changedConversationId, ') | current:', conversationId, '(type:', typeof conversationId, ')')

        if (!changedConversationId) {
          console.log('[ConsultationModal] ❌ No conversation_id found in payload!')
          return
        }

        if (changedConversationId !== conversationId) {
          console.log('[ConsultationModal] 👉 Ignoring message from different conversation (payload conv:', changedConversationId, '!= current conv:', conversationId, ')')
          return
        }

        console.log('[ConsultationModal] ✅ Realtime update matched! Refreshing messages...')
        void getConversationMessages(conversationId)
          .then((data) => {
            console.log('[ConsultationModal] ✅ Messages refreshed via realtime, count:', data.length)
            setMessages(data)
          })
          .catch((err) => console.error('[ConsultationModal] ❌ Realtime modal refresh failed:', err))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload: any) => {
        console.log('[ConsultationModal] 🔔 conversations table change:', JSON.stringify(payload))
      })
      .subscribe((status: any) => {
        console.log('[ConsultationModal] 📡 Channel subscription status:', status)
        console.log('[ConsultationModal] 📡 Subscription status === SUBSCRIBED?', status === 'SUBSCRIBED')
      })

    console.log('[ConsultationModal] Channel created:', channel)

    return () => {
      console.log('[ConsultationModal] Cleaning up realtime channel for conversation:', conversationId)
      void supabase.removeChannel(channel)
    }
  }, [isOpen, conversationId])

  // Polling fallback: refresh messages every 3 seconds when modal is open
  useEffect(() => {
    if (!isOpen || !conversationId) return

    console.log('[ConsultationModal] Setting up polling fallback for conversation:', conversationId)
    
    const interval = setInterval(() => {
      void getConversationMessages(conversationId)
        .then((data) => {
          setMessages((prev) => {
            // Only update if there are new messages (compare by length)
            if (data.length !== prev.length) {
              console.log('[ConsultationModal] Polling: new messages detected!', prev.length, '->', data.length)
              return data
            }
            return prev
          })
        })
        .catch((err) => console.error('[ConsultationModal] Polling refresh failed:', err))
    }, 3000)

    return () => {
      console.log('[ConsultationModal] Cleaning up polling')
      clearInterval(interval)
    }
  }, [isOpen, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const renderMessages = () => {
    return messages.map((message) => {
      const imageUrl = getMessageMediaUrl(message)
      const isImage = isImageMessage(message)
      const isCurrentUser = message.senderId === currentUserId

      return (
        <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
              isCurrentUser
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
            }`}
          >
            {isImage ? (
              <img
                src={imageUrl ?? ''}
                alt="message"
                className="max-w-full max-h-64 rounded-lg object-contain"
              />
            ) : (
              <p>{message.content?.trim() || '(tin nhắn trống)'}</p>
            )}
            <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-slate-500'}`}>
              {message.createdAt
                ? new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
      )
    })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || !conversationId || isSending) return

    try {
      setIsSending(true)
      setError('')
      console.log('[ConsultationModal] Sending message to conversation:', conversationId, 'content:', inputValue)
      await sendMessage(conversationId, inputValue)
      console.log('[ConsultationModal] Message sent successfully, refreshing...')
      setInputValue('')
      const updatedMessages = await getConversationMessages(conversationId)
      setMessages(updatedMessages)
    } catch (error) {
      console.error('Send message error (modal):', error)
      const anyErr: any = error
      const serverMsg = anyErr?.response?.data || anyErr?.message || String(anyErr)
      toast.error(`Có lỗi xảy ra, vui lòng thử lại\n\nChi tiết: ${JSON.stringify(serverMsg)}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !conversationId) return

    try {
      setIsUploadingImage(true)
      setError('')
      console.log('[ConsultationModal] Sending image to conversation:', conversationId)
      await sendImageMessage(conversationId, file)
      console.log('[ConsultationModal] Image sent, refreshing...')
      const updatedMessages = await getConversationMessages(conversationId)
      setMessages(updatedMessages)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Send image error (modal):', error)
      const anyErr: any = error
      const serverMsg = anyErr?.response?.data || anyErr?.message || String(anyErr)
      toast.error(`Gửi ảnh thất bại\n\nChi tiết: ${JSON.stringify(serverMsg)}`)
    } finally {
      setIsUploadingImage(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 animate-in">
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center overflow-hidden">
            {tutorAvatar ? (
              <img src={tutorAvatar} alt={tutorName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-semibold">{tutorName.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">{tutorName}</h3>
            <p className="text-xs text-slate-500">Đang hoạt động</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl leading-none">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-slate-500 text-xs">Đang tải tin nhắn...</p>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <p className="text-red-600 text-xs mb-2">{error}</p>
              <button
                type="button"
                onClick={() => conversationId && getConversationMessages(conversationId).then(setMessages)}
                className="text-xs text-blue-600 hover:underline"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-3xl mb-2">💬</div>
              <p className="text-slate-500 text-xs">Bắt đầu cuộc trò chuyện</p>
            </div>
          </div>
        ) : (
          renderMessages()
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-200 bg-white rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            disabled={isUploadingImage || !conversationId}
          />
          {/* Image icon button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage || !conversationId}
            className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition"
            title="Gửi ảnh"
          >
            🖼️
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={conversationId ? 'Nhập tin nhắn...' : 'Đang khởi tạo cuộc trò chuyện...'}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
            disabled={isSending || !conversationId}
          />
          <button
            type="submit"
            disabled={isSending || !inputValue.trim() || !conversationId}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}