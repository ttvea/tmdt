import { useEffect, useState } from 'react'
import { getConversationsList, type ConversationResponse } from '../api/conversations'

export function ConversationsList() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversationsList()
        setConversations(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching conversations:', err)
        setError('Không thể tải danh sách hội thoại')
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  // Polling every 3 seconds for realtime updates
  useEffect(() => {
    const interval = setInterval(() => {
      void getConversationsList()
        .then((data) => {
          setConversations((prev) => {
            if (JSON.stringify(data) !== JSON.stringify(prev)) {
              return data
            }
            return prev
          })
        })
        .catch((err) => console.error('Polling conversations refresh failed:', err))
    }, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-slate-600">Đang tải...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-slate-600">Chưa có hội thoại nào</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => (
        <div
          key={conv.conversationId}
          className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex gap-3 items-start">
            <div className="w-12 h-12 bg-slate-300 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
              {conv.otherUserAvatar ? (
                <img
                  src={conv.otherUserAvatar}
                  alt={conv.otherUserName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-white">
                  {conv.otherUserName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">{conv.otherUserName}</h3>
              <p className="text-sm text-slate-600 truncate">{conv.lastMessage}</p>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(conv.lastMessageTime).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}