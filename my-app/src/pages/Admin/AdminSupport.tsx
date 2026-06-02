import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import {
  getAdminSupportStats,
  getAdminSupportTicket,
  getAdminSupportTickets,
  getCurrentAdmin,
  replyAdminSupportTicket,
  updateAdminSupportTicketStatus,
  type AdminSession,
  type AdminSupportStats,
  type SupportCategory,
  type SupportPriority,
  type SupportStatus,
  type SupportTicket,
} from '../../api/admin'
import { AdminLayout } from '../../components/AdminLayout'

const PAGE_SIZE = 10

const emptyStats: AdminSupportStats = {
  totalTickets: 0,
  openTickets: 0,
  inProgressTickets: 0,
  waitingUserTickets: 0,
  resolvedTickets: 0,
  closedTickets: 0,
  urgentTickets: 0,
}

const statusLabels: Record<SupportStatus, string> = {
  OPEN: 'Mới gửi',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_USER: 'Chờ người dùng',
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

const roleLabels: Record<string, string> = {
  STUDENT: 'Học sinh',
  TUTOR: 'Gia sư',
  ADMIN: 'Admin',
}

export function AdminSupport() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<AdminSupportStats>(emptyStats)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<SupportStatus | ''>('')
  const [category, setCategory] = useState<SupportCategory | ''>('')
  const [priority, setPriority] = useState<SupportPriority | ''>('')
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [replyMessage, setReplyMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    getCurrentAdmin(token)
      .then((data) => {
        setAdmin(data)
        localStorage.setItem('user', JSON.stringify(data))
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      })
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    setPage(0)
  }, [category, keyword, priority, status])

  useEffect(() => {
    if (checking) return
    loadTickets()
  }, [checking, category, keyword, page, priority, status])

  const statCards = useMemo(
    () => [
      {
        label: 'Tổng yêu cầu',
        value: stats.totalTickets,
        detail: `${stats.openTickets} yêu cầu mới`,
        tone: 'from-blue-600 to-cyan-500',
        icon: <InboxIcon />,
      },
      {
        label: 'Đang xử lý',
        value: stats.inProgressTickets,
        detail: `${stats.waitingUserTickets} đang chờ người dùng`,
        tone: 'from-violet-600 to-blue-500',
        icon: <RefreshIcon />,
      },
      {
        label: 'Đã xử lý',
        value: stats.resolvedTickets + stats.closedTickets,
        detail: `${stats.closedTickets} ticket đã đóng`,
        tone: 'from-emerald-600 to-teal-500',
        icon: <CheckCircleIcon />,
      },
      {
        label: 'Khẩn cấp',
        value: stats.urgentTickets,
        detail: stats.urgentTickets > 0 ? 'Cần ưu tiên hôm nay' : 'Không có cảnh báo',
        tone: 'from-rose-600 to-orange-500',
        icon: <AlertIcon />,
      },
    ],
    [stats],
  )

  async function loadTickets() {
    setLoading(true)
    try {
      const [ticketsPage, statsData] = await Promise.all([
        getAdminSupportTickets({
          keyword,
          status,
          category,
          priority,
          page,
          size: PAGE_SIZE,
        }),
        getAdminSupportStats().catch(() => emptyStats),
      ])

      setTickets(ticketsPage.content)
      setTotalElements(ticketsPage.totalElements)
      setTotalPages(Math.max(1, ticketsPage.totalPages))
      setStats(statsData)
    } catch {
      setTickets([])
      setTotalElements(0)
      setTotalPages(1)
      toast.error('Không thể tải danh sách hỗ trợ.')
    } finally {
      setLoading(false)
    }
  }

  async function openTicket(ticket: SupportTicket) {
    try {
      const detail = await getAdminSupportTicket(ticket.id)
      setSelectedTicket(detail)
      setReplyMessage('')
    } catch {
      toast.error('Không thể tải chi tiết yêu cầu hỗ trợ.')
    }
  }

  async function handleChangeStatus(nextStatus: SupportStatus) {
    if (!selectedTicket) return

    setSubmitting(true)
    try {
      const updated = await updateAdminSupportTicketStatus(selectedTicket.id, nextStatus)
      setSelectedTicket(updated)
      setTickets((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated, replies: item.replies } : item)))
      getAdminSupportStats().then(setStats).catch(() => {})
      toast.success('Đã cập nhật trạng thái hỗ trợ.')
    } catch {
      toast.error('Không thể cập nhật trạng thái.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReply() {
    if (!selectedTicket || !replyMessage.trim()) return

    setSubmitting(true)
    try {
      const updated = await replyAdminSupportTicket(selectedTicket.id, replyMessage.trim())
      setSelectedTicket(updated)
      setReplyMessage('')
      setTickets((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated, replies: item.replies } : item)))
      getAdminSupportStats().then(setStats).catch(() => {})
      toast.success('Đã gửi phản hồi.')
    } catch {
      toast.error('Không thể gửi phản hồi.')
    } finally {
      setSubmitting(false)
    }
  }

  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements)

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-sm font-semibold text-slate-600">
        Đang kiểm tra quyền quản trị...
      </div>
    )
  }

  return (
    <AdminLayout activePath="/admin/support" adminName={admin?.fullName}>
      <div className="mb-6 flex items-end justify-between gap-5">
        <div role="heading" aria-level={1} className="text-2xl font-bold text-blue-900">
          Trung tâm Hỗ trợ
        </div>
        <button
          type="button"
          onClick={loadTickets}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-800 shadow-sm hover:bg-blue-50"
        >
          <RefreshIcon /> Làm mới
        </button>
      </div>

      <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className={`h-1.5 bg-gradient-to-r ${card.tone}`} />
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.tone} text-white shadow-sm [&_svg]:h-5 [&_svg]:w-5`}>
                  {card.icon}
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">Live</span>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">{card.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-950">{card.value.toLocaleString('vi-VN')}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{card.detail}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-5 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-[260px] flex-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Tìm kiếm</label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              type="search"
              placeholder="Mã ticket, tiêu đề, tên hoặc email"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <FilterSelect
          label="Trạng thái"
          value={status}
          onChange={(value) => setStatus(value as SupportStatus | '')}
          options={[
            { label: 'Tất cả', value: '' },
            ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
          ]}
        />
        <FilterSelect
          label="Loại vấn đề"
          value={category}
          onChange={(value) => setCategory(value as SupportCategory | '')}
          options={[
            { label: 'Tất cả', value: '' },
            ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
          ]}
        />
        <FilterSelect
          label="Ưu tiên"
          value={priority}
          onChange={(value) => setPriority(value as SupportPriority | '')}
          options={[
            { label: 'Tất cả', value: '' },
            ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label })),
          ]}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-blue-200 bg-blue-50 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-blue-900">Danh sách yêu cầu hỗ trợ</p>
              <p className="mt-0.5 text-xs font-semibold text-blue-700/80">
                Hiển thị {showingFrom} - {showingTo} trong {totalElements.toLocaleString('vi-VN')} yêu cầu
              </p>
            </div>
            {loading && <span className="text-xs font-bold text-blue-700">Đang tải...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="border-b border-blue-200 bg-blue-50">
                <tr>
                  <TableHead>Mã</TableHead>
                  <TableHead>Người gửi</TableHead>
                  <TableHead>Vấn đề</TableHead>
                  <TableHead>Ưu tiên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead align="right">Thao tác</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-bold text-blue-700">{ticket.ticketCode}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={ticket.requesterName} />
                        <div>
                          <p className="font-semibold text-slate-950">{ticket.requesterName}</p>
                          <p className="text-xs text-slate-500">{ticket.requesterEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[260px] truncate text-sm font-semibold text-slate-900">{ticket.subject}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{categoryLabels[ticket.category]}</p>
                    </td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(ticket.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openTicket(ticket)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        title="Xem chi tiết"
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && tickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      Không có yêu cầu hỗ trợ nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
        </section>

        <TicketDetailPanel
          ticket={selectedTicket}
          replyMessage={replyMessage}
          submitting={submitting}
          onReplyChange={setReplyMessage}
          onReply={handleReply}
          onChangeStatus={handleChangeStatus}
          onClose={() => setSelectedTicket(null)}
        />
      </div>
    </AdminLayout>
  )
}

function TicketDetailPanel({
  ticket,
  replyMessage,
  submitting,
  onReplyChange,
  onReply,
  onChangeStatus,
  onClose,
}: {
  ticket: SupportTicket | null
  replyMessage: string
  submitting: boolean
  onReplyChange: (value: string) => void
  onReply: () => void
  onChangeStatus: (status: SupportStatus) => void
  onClose: () => void
}) {
  if (!ticket) {
    return (
      <aside className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 [&_svg]:h-7 [&_svg]:w-7">
          <SupportIcon />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-950">Chọn một yêu cầu để xử lý</p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
          Chi tiết ticket, lịch sử phản hồi và các thao tác đổi trạng thái sẽ hiển thị tại đây.
        </p>
      </aside>
    )
  }

  return (
    <aside className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
        <div>
          <p className="font-mono text-xs font-bold text-blue-700">{ticket.ticketCode}</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">{ticket.subject}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {categoryLabels[ticket.category]}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          title="Đóng"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={ticket.requesterName} />
            <div>
              <p className="font-bold text-slate-950">{ticket.requesterName}</p>
              <p className="text-xs text-slate-500">
                {roleLabels[ticket.requesterRole ?? ''] ?? ticket.requesterRole ?? 'Người dùng'} · {ticket.requesterEmail}
              </p>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{ticket.message}</p>
          <p className="mt-3 text-xs font-semibold text-slate-400">Gửi lúc {formatDateTime(ticket.createdAt)}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Cập nhật trạng thái</label>
          <select
            value={ticket.status}
            disabled={submitting}
            onChange={(event) => onChangeStatus(event.target.value as SupportStatus)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-950">Lịch sử phản hồi</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
              {ticket.replies.length} phản hồi
            </span>
          </div>
          <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
            {ticket.replies.map((reply) => (
              <div
                key={reply.id}
                className={`rounded-xl p-4 ${reply.adminReply ? 'bg-blue-50' : 'bg-slate-50'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm font-bold ${reply.adminReply ? 'text-blue-900' : 'text-slate-900'}`}>
                    {reply.senderName}
                  </p>
                  <span className="text-xs font-semibold text-slate-400">{formatDateTime(reply.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{reply.message}</p>
              </div>
            ))}

            {ticket.replies.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
                Chưa có phản hồi nào.
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Phản hồi người dùng</label>
          <textarea
            value={replyMessage}
            onChange={(event) => onReplyChange(event.target.value)}
            rows={4}
            placeholder="Nhập nội dung phản hồi..."
            className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
    </aside>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div className="min-w-[150px]">
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
    OPEN: 'bg-blue-50 text-blue-700 ring-blue-100',
    IN_PROGRESS: 'bg-violet-50 text-violet-700 ring-violet-100',
    WAITING_USER: 'bg-amber-50 text-amber-700 ring-amber-100',
    RESOLVED: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    CLOSED: 'bg-slate-100 text-slate-600 ring-slate-200',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${className[status]}`}>
      {statusLabels[status]}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: SupportPriority }) {
  const className: Record<SupportPriority, string> = {
    LOW: 'bg-slate-100 text-slate-600',
    NORMAL: 'bg-cyan-50 text-cyan-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-rose-50 text-rose-700',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${className[priority]}`}>
      {priorityLabels[priority]}
    </span>
  )
}

function TableHead({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-5 py-3 text-xs font-bold uppercase tracking-wide text-blue-800 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-900">
      {getInitials(name)}
    </div>
  )
}

function getInitials(name?: string) {
  if (!name) return 'US'
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
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

function Svg({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <svg className={className || 'h-4 w-4'} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">{children}</svg>
}
function SearchIcon(props: { className?: string }) { return <Svg {...props}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg> }
function InboxIcon() { return <Svg><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5 5h14l3 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6l3-7Z" /></Svg> }
function RefreshIcon() { return <Svg><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /><path d="M3 12A9 9 0 0 1 18.5 5.8L21 8" /><path d="M21 3v5h-5" /></Svg> }
function CheckCircleIcon() { return <Svg><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></Svg> }
function AlertIcon() { return <Svg><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></Svg> }
function EyeIcon() { return <Svg><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Svg> }
function CloseIcon() { return <Svg><path d="M18 6 6 18M6 6l12 12" /></Svg> }
function SupportIcon() { return <Svg><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H4zM17 14h3v5h-3z" /><path d="M13 19h2a5 5 0 0 0 5-5" /></Svg> }
function SendIcon() { return <Svg><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></Svg> }
