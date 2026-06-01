import { useEffect, useRef, useState } from 'react'
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
        const data = await getConversationMessages(conversationId)
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
    if (!supabase || !isOpen || !conversationId) return

    const channel = supabase
      .channel('msg-changes-modal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        console.log('Realtime modal payload:', payload)

        const changedConversationId = Number(
          payload?.new?.conversation_id ?? payload?.new?.conversationId ?? payload?.old?.conversation_id ?? payload?.old?.conversationId
        )

        if (changedConversationId && changedConversationId !== conversationId) return

        void getConversationMessages(conversationId)
          .then((data) => setMessages(data))
          .catch((err) => console.error('Realtime modal refresh failed:', err))
      })

    try {
      void channel.subscribe((status: any) => {
        // eslint-disable-next-line no-console
        console.log('[supabase] channel status (modal):', status)
      })
      // eslint-disable-next-line no-console
      console.log('[supabase] channel object (modal):', channel)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[supabase] subscribe error (modal):', err)
    }

    return () => {
      void supabase.removeChannel(channel)
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
      await sendMessage(conversationId, inputValue)
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
      await sendImageMessage(conversationId, file)
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
