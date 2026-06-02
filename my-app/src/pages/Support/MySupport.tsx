import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import { AccountLayout } from '../../components/AccountLayout'
import { isTutorRole } from '../../utils/userRole'
import {
  createSupportTicket,
  getMySupportTicket,
  getMySupportTickets,
  replyMySupportTicket,
  type SupportCategory,
  type SupportPriority,
  type SupportStatus,
  type SupportTicket,
} from '../../api/support'

const PAGE_SIZE = 8

const statusLabels: Record<SupportStatus, string> = {
  OPEN: 'Mới gửi',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_USER: 'Chờ bạn phản hồi',
  RESOLVED: 'Đã xử lý',
  CLOSED: 'Đã đóng',
}

const categoryLabels: Record<SupportCategory, string> = {
  ACCOUNT: 'Tài khoản',
  TUTOR_PROFILE: 'Hồ sơ gia sư',
  VERIFICATION: 'Duyệt hồ sơ',
  CLASS: 'Lớp học',
  PAYMENT: 'Thanh toán',
  VOUCHER: 'Mã giảm giá',
  REPORT: 'Báo cáo sự cố',
  OTHER: 'Khác',
}

const priorityLabels: Record<SupportPriority, string> = {
  LOW: 'Thấp',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
}

export function MySupport() {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const isTutor = isTutorRole(user?.role)
  const activePath = isTutor ? '/tutor/support' : '/student/support'

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [formData, setFormData] = useState<{
    subject: string
    category: SupportCategory
    priority: SupportPriority
    message: string
  }>({
    subject: '',
    category: isTutor ? 'TUTOR_PROFILE' : 'CLASS',
    priority: 'NORMAL',
    message: '',
  })

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      window.location.href = '/login'
      return
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [page])

  const stats = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS').length
    const waiting = tickets.filter((ticket) => ticket.status === 'WAITING_USER').length
    const done = tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length
    return { open, waiting, done }
  }, [tickets])

  async function loadTickets() {
    setLoading(true)
    try {
      const data = await getMySupportTickets({ page, size: PAGE_SIZE })
      setTickets(data.content)
      setTotalPages(Math.max(1, data.totalPages))
      setTotalElements(data.totalElements)
      if (!selectedTicket && data.content.length > 0) {
        openTicket(data.content[0], false)
      }
    } catch {
      toast.error('Không thể tải danh sách hỗ trợ.')
      setTickets([])
      setTotalPages(1)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  async function openTicket(ticket: SupportTicket, showError = true) {
    try {
      const detail = await getMySupportTicket(ticket.id)
      setSelectedTicket(detail)
      setReplyMessage('')
    } catch {
      if (showError) toast.error('Không thể tải chi tiết hỗ trợ.')
    }
  }

  async function handleCreateTicket(event: FormEvent) {
    event.preventDefault()

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung hỗ trợ.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createSupportTicket({
        ...formData,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      })
      toast.success('Đã gửi yêu cầu hỗ trợ. Admin sẽ phản hồi sớm.')
      setFormData({
        subject: '',
        category: isTutor ? 'TUTOR_PROFILE' : 'CLASS',
        priority: 'NORMAL',
        message: '',
      })
      setPage(0)
      await loadTickets()
      await openTicket(created, false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gửi yêu cầu hỗ trợ.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReply() {
    if (!selectedTicket || !replyMessage.trim()) return

    setSubmitting(true)
    try {
      const updated = await replyMySupportTicket(selectedTicket.id, replyMessage.trim())
      setSelectedTicket(updated)
      setReplyMessage('')
      setTickets((prev) => prev.map((ticket) => (ticket.id === updated.id ? { ...ticket, ...updated, replies: ticket.replies } : ticket)))
      toast.success('Đã gửi phản hồi.')
    } catch {
      toast.error('Không thể gửi phản hồi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AccountLayout activePath={activePath}>
      <div className="min-h-screen bg-slate-100 px-4 py-6 text-left md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="m-0 text-2xl font-bold text-blue-900">Hỗ trợ của tôi</h1>
            </div>
            <button
              type="button"
              onClick={loadTickets}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-800 shadow-sm hover:bg-blue-50"
            >
              <RefreshIcon /> Làm mới
            </button>
          </div>

          <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard label="Tổng yêu cầu" value={totalElements} detail="Ticket đã gửi" icon={<InboxIcon />} tone="from-blue-600 to-cyan-500" />
            <StatCard label="Đang xử lý" value={stats.open} detail="Admin đang kiểm tra" icon={<ClockIcon />} tone="from-violet-600 to-blue-500" />
            <StatCard label="Chờ phản hồi" value={stats.waiting} detail="Cần bạn bổ sung thông tin" icon={<ReplyIcon />} tone="from-amber-500 to-orange-500" />
            <StatCard label="Hoàn tất" value={stats.done} detail="Đã xử lý hoặc đã đóng" icon={<CheckIcon />} tone="from-emerald-600 to-teal-500" />
          </section>

          <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Gửi yêu cầu hỗ trợ</h2>
              <form className="mt-5 grid gap-4" onSubmit={handleCreateTicket}>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Tiêu đề</label>
                  <input
                    value={formData.subject}
                    onChange={(event) => setFormData((prev) => ({ ...prev, subject: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Ví dụ: Tôi không đăng lớp được"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <FormSelect
                    label="Loại vấn đề"
                    value={formData.category}
                    onChange={(value) => setFormData((prev) => ({ ...prev, category: value as SupportCategory }))}
                    options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
                  />
                  <FormSelect
                    label="Mức độ"
                    value={formData.priority}
                    onChange={(value) => setFormData((prev) => ({ ...prev, priority: value as SupportPriority }))}
                    options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Nội dung</label>
                  <textarea
                    value={formData.message}
                    onChange={(event) => setFormData((prev) => ({ ...prev, message: event.target.value }))}
                    rows={6}
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Mô tả rõ vấn đề bạn đang gặp để admin hỗ trợ nhanh hơn..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SendIcon /> Gửi hỗ trợ
                </button>
              </form>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(360px,1.12fr)]">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-blue-200 bg-blue-50 px-5 py-4">
                  <p className="text-sm font-bold text-blue-900">Danh sách yêu cầu</p>
                  <p className="mt-0.5 text-xs font-semibold text-blue-700/80">Theo dõi tiến độ và phản hồi từ admin</p>
                </div>

                <div className="max-h-[640px] overflow-y-auto">
                  {tickets.map((ticket) => (
                    <button
                      type="button"
                      key={ticket.id}
                      onClick={() => openTicket(ticket)}
                      className={`w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                        selectedTicket?.id === ticket.id ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold text-blue-700">{ticket.ticketCode}</p>
                          <p className="mt-1 truncate text-sm font-bold text-slate-950">{ticket.subject}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{categoryLabels[ticket.category]} · {formatDate(ticket.createdAt)}</p>
                        </div>
                        <StatusBadge status={ticket.status} />
                      </div>
                    </button>
                  ))}

                  {!loading && tickets.length === 0 && (
                    <div className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                      Bạn chưa gửi yêu cầu hỗ trợ nào.
                    </div>
                  )}

                  {loading && (
                    <div className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                      Đang tải danh sách hỗ trợ...
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4">
                  <span className="text-sm text-slate-500">Trang {page + 1} / {totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page === 0}
                      onClick={() => setPage((value) => Math.max(0, value - 1))}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Tiếp
                    </button>
                  </div>
                </div>
              </div>

              <TicketDetail
                ticket={selectedTicket}
                replyMessage={replyMessage}
                submitting={submitting}
                onReplyChange={setReplyMessage}
                onReply={handleReply}
              />
            </section>
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}

function TicketDetail({
  ticket,
  replyMessage,
  submitting,
  onReplyChange,
  onReply,
}: {
  ticket: SupportTicket | null
  replyMessage: string
  submitting: boolean
  onReplyChange: (value: string) => void
  onReply: () => void
}) {
  if (!ticket) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 [&_svg]:h-7 [&_svg]:w-7">
          <HeadsetIcon />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-950">Chọn yêu cầu để xem phản hồi</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Khi admin phản hồi, nội dung trao đổi sẽ hiển thị tại đây.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="font-mono text-xs font-bold text-blue-700">{ticket.ticketCode}</p>
        <h2 className="mt-1 text-lg font-bold text-slate-950">{ticket.subject}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{categoryLabels[ticket.category]}</span>
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">{priorityLabels[ticket.priority]}</span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Nội dung ban đầu</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{ticket.message}</p>
          <p className="mt-3 text-xs font-semibold text-slate-400">Gửi lúc {formatDateTime(ticket.createdAt)}</p>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-slate-950">Trao đổi với admin</p>
          <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
            {ticket.replies.map((reply) => (
              <div key={reply.id} className={`rounded-xl p-4 ${reply.adminReply ? 'bg-blue-50' : 'bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm font-bold ${reply.adminReply ? 'text-blue-900' : 'text-slate-900'}`}>
                    {reply.adminReply ? 'Admin' : reply.senderName}
                  </p>
                  <span className="text-xs font-semibold text-slate-400">{formatDateTime(reply.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{reply.message}</p>
              </div>
            ))}

            {ticket.replies.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
                Admin chưa phản hồi yêu cầu này.
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Phản hồi thêm</label>
          <textarea
            value={replyMessage}
            onChange={(event) => onReplyChange(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Bổ sung thông tin hoặc phản hồi lại admin..."
          />
          <button
            type="button"
            disabled={submitting || !replyMessage.trim()}
            onClick={onReply}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SendIcon /> Gửi phản hồi
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, detail, icon, tone }: { label: string; value: number; detail: string; icon: ReactNode; tone: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-1.5 bg-gradient-to-r ${tone}`} />
      <div className="p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-sm [&_svg]:h-5 [&_svg]:w-5`}>
          {icon}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-950">{value.toLocaleString('vi-VN')}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
      </div>
    </div>
  )
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}

function StatusBadge({ status }: { status: SupportStatus }) {
  const className: Record<SupportStatus, string> = {
    OPEN: 'bg-blue-50 text-blue-700',
    IN_PROGRESS: 'bg-violet-50 text-violet-700',
    WAITING_USER: 'bg-amber-50 text-amber-700',
    RESOLVED: 'bg-emerald-50 text-emerald-700',
    CLOSED: 'bg-slate-100 text-slate-600',
  }

  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${className[status]}`}>
      {statusLabels[status]}
    </span>
  )
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

function formatDateTime(value: string | null) {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function Svg({ children }: { children: ReactNode }) {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">{children}</svg>
}
function RefreshIcon() { return <Svg><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /><path d="M3 12A9 9 0 0 1 18.5 5.8L21 8" /><path d="M21 3v5h-5" /></Svg> }
function InboxIcon() { return <Svg><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5 5h14l3 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6l3-7Z" /></Svg> }
function ClockIcon() { return <Svg><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Svg> }
function ReplyIcon() { return <Svg><path d="m9 17-5-5 5-5" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></Svg> }
function CheckIcon() { return <Svg><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></Svg> }
function SendIcon() { return <Svg><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></Svg> }
function HeadsetIcon() { return <Svg><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H4zM17 14h3v5h-3z" /><path d="M13 19h2a5 5 0 0 0 5-5" /></Svg> }
