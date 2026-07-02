import { useEffect, useRef, useState } from 'react'
import Navbar from '../../layouts/Navbar'
import Footer from '../../layouts/Footer'
import { getConversationsList, getConversationMessages, sendMessage, sendImageMessage, getMessageMediaUrl, isImageMessage, type ConversationResponse, type MessageResponse } from '../../api/conversations'

export function StudentMessages() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null)
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [messageLoading, setMessageLoading] = useState(false)
  const [error, setError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

    // Get current user ID from localStorage on mount
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

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        console.log('Fetching conversations...')
        const data = await getConversationsList()
        console.log('Conversations fetched:', data)
        console.log('First conversation structure:', data[0])
        setConversations(data)
        setError('')
        // Auto-select first conversation if available
        if (data.length > 0) {
          setSelectedConvId(data[0].conversationId)
        }
      } catch (err) {
        console.error('Error fetching conversations:', err)
        const anyErr: any = err
        const errorMsg = anyErr?.response?.data?.message || anyErr?.message || 'Không thể tải danh sách hội thoại'
        setError(`❌ ${errorMsg}`)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  // Polling every 3 seconds for messages and conversations
  useEffect(() => {
    const interval = setInterval(() => {
      void (async () => {
        try {
          const updatedConversations = await getConversationsList()
          setConversations(updatedConversations)

          if (selectedConvId) {
            const updatedMessages = await getConversationMessages(selectedConvId)
            setMessages((prev) => {
              if (JSON.stringify(updatedMessages) !== JSON.stringify(prev)) {
                return updatedMessages
              }
              return prev
            })
          }
        } catch (err) {
          // Silent fail for polling
        }
      })()
    }, 3000)

    return () => clearInterval(interval)
  }, [selectedConvId])

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (!selectedConvId) return

    const fetchMessages = async () => {
      try {
        setMessageLoading(true)
        setMessageError('')
        const data = await getConversationMessages(selectedConvId)
        setMessages(data)
      } catch (err) {
        console.error('Error fetching messages:', err)
        setMessageError('Không thể tải tin nhắn')
      } finally {
        setMessageLoading(false)
      }
    }

    fetchMessages()
  }, [selectedConvId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || !selectedConvId || sending) return

    try {
      setSending(true)
      await sendMessage(selectedConvId, inputValue)
      setInputValue('')

      // Refresh messages
      const updatedMessages = await getConversationMessages(selectedConvId)
      setMessages(updatedMessages)
    } catch (err) {
      console.error('Error sending message:', err)
      setMessageError('Gửi tin nhắn thất bại')
    } finally {
      setSending(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedConvId) return

    try {
      setIsUploadingImage(true)
      setMessageError('')
      await sendImageMessage(selectedConvId, file)
      const updatedMessages = await getConversationMessages(selectedConvId)
      setMessages(updatedMessages)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Send image error:', error)
      setMessageError('Gửi ảnh thất bại')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const selectedConversation = conversations.find(
    (c) => c.conversationId === selectedConvId
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      {/* Header */}
      <section className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">💬 Tin nhắn</h1>
          <p className="text-sm text-slate-600">Quản lý hội thoại với gia sư</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 h-[600px]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-bold text-slate-900">Danh sách hội thoại</h2>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-slate-600 text-sm">⏳ Đang tải...</div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="text-center">
                    <div className="text-red-600 text-sm mb-3 font-mono bg-red-50 p-3 rounded">
                      {error}
                    </div>
                    <p className="text-xs text-slate-600 mb-3">
                      Kiểm tra:<br/>
                      1. Backend đang chạy? (localhost:8080)<br/>
                      2. Token hợp lệ?<br/>
                      3. Xem DevTools → Console
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      🔄 Thử lại
                    </button>
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="text-center">
                    <div className="text-3xl mb-2">💭</div>
                    <p className="text-slate-600 text-sm">Chưa có hội thoại nào</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conv) => (
                    <button
                      key={conv.conversationId}
                      onClick={() => setSelectedConvId(conv.conversationId)}
                      className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition ${
                        selectedConvId === conv.conversationId ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <div className="w-10 h-10 bg-slate-300 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {conv.otherUserAvatar ? (
                            <img
                              src={conv.otherUserAvatar}
                              alt={conv.otherUserName || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-white">
                              {(conv.otherUserName || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm">{conv.otherUserName || 'Không tên'}</h3>
                          <p className="text-xs text-slate-600 truncate">{conv.lastMessage || 'Không có tin nhắn'}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 flex flex-col overflow-hidden">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-3">📧</div>
                    <p className="text-slate-600">Chọn một hội thoại để bắt đầu</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center gap-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
                      {selectedConversation.otherUserAvatar ? (
                        <img
                          src={selectedConversation.otherUserAvatar}
                          alt={selectedConversation.otherUserName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold">
                          {(selectedConversation.otherUserName || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedConversation.otherUserName || 'Không tên'}</h3>
                      <p className="text-xs text-blue-100">Đang hoạt động</p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {messageLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="text-slate-600 text-sm">⏳ Đang tải tin nhắn...</div>
                      </div>
                    ) : messageError ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="text-center">
                          <div className="text-red-600 text-sm mb-2">{messageError}</div>
                          <button
                            onClick={() => selectedConvId && getConversationMessages(selectedConvId).then(setMessages)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            🔄 Thử lại
                          </button>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="text-center">
                          <div className="text-3xl mb-2">👋</div>
                          <p className="text-slate-600 text-sm">Bắt đầu cuộc trò chuyện</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const imageUrl = getMessageMediaUrl(msg)
                        const isImage = isImageMessage(msg)
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs px-4 py-2 rounded-lg ${
                                msg.senderId === currentUserId
                                  ? 'bg-blue-600 text-white rounded-br-none'
                                  : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                              }`}
                            >
                              {isImage ? (
                                <img
                                  src={imageUrl ?? ''}
                                  alt="message"
                                  className="max-w-full max-h-64 rounded-lg object-contain"
                                />
                              ) : (
                                <p className="text-sm">{msg.content?.trim() || '(tin nhắn trống)'}</p>
                              )}
                              <p
                                className={`text-xs mt-1 ${
                                  msg.senderId === currentUserId ? 'text-blue-100' : 'text-slate-500'
                                }`}
                              >
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Input Area */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-slate-200 bg-white flex gap-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage || !selectedConvId}
                      className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                      title="Gửi ảnh"
                    >
                      🖼️
                    </button>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !inputValue.trim()}
                      className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                      </svg>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
