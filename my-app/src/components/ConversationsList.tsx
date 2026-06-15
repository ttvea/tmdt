import { useEffect, useState } from 'react'
import { getConversationsList, type ConversationResponse } from '../api/conversations'
import { supabase } from '../api/supabase'

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

  useEffect(() => {
    if (!supabase) {
      console.log('[ConversationsList] supabase client is NULL - check env vars')
      return
    }

    console.log('[ConversationsList] Setting up realtime subscription...')

    // Subscribe to cả messages và conversations table
    const channel = supabase
      .channel('msg-changes-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        console.log('[ConversationsList] ===== REALTIME MESSAGES PAYLOAD =====')
        console.log('[ConversationsList] Full payload:', JSON.stringify(payload, null, 2))
        console.log('[ConversationsList] payload.eventType:', payload?.eventType)
        void getConversationsList()
          .then((data) => {
            console.log('[ConversationsList] Conversations refreshed, count:', data.length)
            setConversations(data)
          })
          .catch((err) => console.error('Realtime conversations refresh failed:', err))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload: any) => {
        console.log('[ConversationsList] ===== REALTIME CONVERSATIONS PAYLOAD =====')
        console.log('[ConversationsList] Payload:', JSON.stringify(payload, null, 2))
        void getConversationsList()
          .then((data) => {
            console.log('[ConversationsList] Conversations refreshed, count:', data.length)
            setConversations(data)
          })
          .catch((err) => console.error('Realtime conversations refresh failed:', err))
      })
      .subscribe((status: any) => {
        console.log('[ConversationsList] 📡 Subscription status:', status)
        console.log('[ConversationsList] 📡 Is SUBSCRIBED?', status === 'SUBSCRIBED')
      })

    console.log('[ConversationsList] Channel created:', channel)

    return () => {
      console.log('[ConversationsList] Cleaning up realtime channel')
      void supabase.removeChannel(channel)
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