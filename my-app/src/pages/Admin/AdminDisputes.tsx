import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import {
  addAdminDisputeNote,
  getAdminDispute,
  getAdminDisputeStats,
  getAdminDisputes,
  getCurrentAdmin,
  resolveAdminDispute,
  type AdminDispute,
  type AdminDisputeStats,
  type AdminSession,
  type DisputePriority,
  type DisputeResolutionType,
  type DisputeStatus,
} from '../../api/admin'
import { AdminLayout } from '../../components/AdminLayout'

const PAGE_SIZE = 10

const emptyStats: AdminDisputeStats = {
  totalDisputes: 0,
  activeDisputes: 0,
  pendingDisputes: 0,
  resolvedDisputes: 0,
  refundedDisputes: 0,
  rejectedDisputes: 0,
  activeAmount: 0,
  successRate: 0,
}

const statusLabels: Record<DisputeStatus, string> = {
  PENDING: 'Chờ xử lý',
  REVIEWING: 'Đang xem xét',
  NEED_EVIDENCE: 'Cần bằng chứng',
  RESOLVED: 'Đã giải quyết',
  REFUNDED: 'Hoàn tiền',
  REJECTED: 'Bác bỏ',
  CLOSED: 'Đã đóng',
}

const priorityLabels: Record<DisputePriority, string> = {
  LOW: 'Thấp',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
}

const resolutionLabels: Record<DisputeResolutionType, string> = {
  NONE: 'Chưa quyết định',
  FULL_REFUND: 'Hoàn tiền toàn bộ',
  PARTIAL_REFUND: 'Hoàn tiền một phần',
  MAKE_UP_CLASS: 'Yêu cầu học bù',
  WARNING: 'Cảnh cáo',
  REJECTED: 'Bác bỏ khiếu nại',
}

export function AdminDisputes() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [stats, setStats] = useState<AdminDisputeStats>(emptyStats)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<DisputeStatus | ''>('')
  const [priority, setPriority] = useState<DisputePriority | ''>('')
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<AdminDispute | null>(null)
  const [showResolve, setShowResolve] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resolveForm, setResolveForm] = useState<{
    status: DisputeStatus
    resolutionType: DisputeResolutionType
    resolutionNote: string
  }>({
    status: 'REVIEWING',
    resolutionType: 'NONE',
    resolutionNote: '',
  })
  const [noteText, setNoteText] = useState('')

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
  }, [keyword, priority, status])

  useEffect(() => {
    if (checking) return
    loadDisputes()
  }, [checking, keyword, page, priority, status])

  const recentNotes = useMemo(
    () => disputes.filter((item) => item.resolutionNote || item.notes?.length > 0).slice(0, 3),
    [disputes],
  )

  async function loadDisputes() {
    setLoading(true)
    try {
      const [pageData, statsData] = await Promise.all([
        getAdminDisputes({ keyword, status, priority, page, size: PAGE_SIZE }),
        getAdminDisputeStats().catch(() => emptyStats),
      ])
      setDisputes(pageData.content)
      setTotalElements(pageData.totalElements)
      setTotalPages(Math.max(1, pageData.totalPages))
      setStats(statsData)
    } catch {
      setDisputes([])
      setTotalElements(0)
      setTotalPages(1)
      toast.error('Không thể tải danh sách tranh chấp.')
    } finally {
      setLoading(false)
    }
  }

  async function openDispute(dispute: AdminDispute) {
    try {
      const detail = await getAdminDispute(dispute.id)
      setSelected(detail)
      setResolveForm({
        status: detail.status,
        resolutionType: detail.resolutionType ?? 'NONE',
        resolutionNote: detail.resolutionNote ?? '',
      })
      setNoteText('')
    } catch {
      toast.error('Không thể tải chi tiết tranh chấp.')
    }
  }

  async function handleResolve() {
    if (!selected) return
    setSubmitting(true)
    try {
      const updated = await resolveAdminDispute(selected.id, {
        status: resolveForm.status,
        resolutionType: resolveForm.resolutionType,
        resolutionNote: resolveForm.resolutionNote.trim() || null,
      })
      setSelected(updated)
      setDisputes((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated, notes: item.notes } : item)))
      setShowResolve(false)
      getAdminDisputeStats().then(setStats).catch(() => {})
      toast.success('Đã cập nhật kết quả xử lý tranh chấp.')
    } catch {
      toast.error('Không thể xử lý tranh chấp.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddNote() {
    if (!selected || !noteText.trim()) return
    setSubmitting(true)
    try {
      const updated = await addAdminDisputeNote(selected.id, noteText.trim())
      setSelected(updated)
      setNoteText('')
      toast.success('Đã thêm ghi chú xử lý.')
    } catch {
      toast.error('Không thể thêm ghi chú.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-sm font-semibold text-slate-600">
        Đang kiểm tra quyền quản trị...
      </div>
    )
  }

  return (
    <AdminLayout activePath="/admin/disputes" adminName={admin?.fullName}>
      <div className="space-y-7">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div role="heading" aria-level={1} className="text-2xl font-bold text-blue-900">
            Giải quyết Tranh chấp
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-11 w-[300px] rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Tìm kiếm tranh chấp..."
              />
            </div>
            <FilterSelect
              value={status}
              onChange={(value) => setStatus(value as DisputeStatus | '')}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
              ]}
            />
            <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-800">
              <DownloadIcon /> Xuất báo cáo
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <MetricCard label="Tranh chấp đang xử lý" value={String(stats.activeDisputes)} trend={`${stats.pendingDisputes} chờ xử lý`} icon={<ClipboardIcon />} progress={68} />
          <MetricCard label="Tổng số tiền tranh chấp" value={formatCompactMoney(stats.activeAmount)} suffix="VND" note="Cần phê duyệt trong 48h" icon={<MoneyIcon />} />
          <MetricCard label="Tỷ lệ giải quyết thành công" value={`${stats.successRate}%`} trend={`${stats.refundedDisputes} hoàn tiền`} icon={<CheckBadgeIcon />} progress={84} segmented />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-950">Danh sách Tranh chấp gần đây</h2>
            <FilterSelect
              value={priority}
              onChange={(value) => setPriority(value as DisputePriority | '')}
              options={[
                { value: '', label: 'Tất cả mức độ' },
                ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead className="border-b border-slate-300 bg-slate-50">
                <tr>
                  <TableHead>Mã case</TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Gia sư</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead align="right">Thao tác</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {disputes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <button onClick={() => openDispute(item)} className="font-mono text-sm font-bold leading-6 text-blue-700 hover:underline">
                        #{item.caseCode}
                      </button>
                    </td>
                    <td className="px-6 py-5"><UserCell name={item.studentName || 'Chưa xác định'} /></td>
                    <td className="px-6 py-5 text-sm font-medium leading-6 text-slate-950">{item.tutorName || 'Chưa xác định'}</td>
                    <td className="px-6 py-5 text-sm font-extrabold text-slate-950">{formatCurrency(item.amount || 0)}</td>
                    <td className="px-6 py-5">
                      <span className="rounded bg-slate-200 px-2 py-1 text-xs font-semibold uppercase text-slate-700">{item.reason}</span>
                    </td>
                    <td className="px-6 py-5"><StatusBadge status={item.status} /></td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => openDispute(item)} className="text-blue-700 hover:text-blue-900" title="Xem chi tiết"><EyeIcon /></button>
                        <button type="button" onClick={() => { openDispute(item); setShowResolve(true) }} className="text-blue-700 hover:text-blue-900" title="Giải quyết"><GavelIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && disputes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                      Chưa có tranh chấp nào.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-300 px-6 py-5">
            <p className="text-sm text-slate-600">Hiển thị {totalElements === 0 ? 0 : page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalElements)} trên {totalElements} tranh chấp</p>
            <div className="flex items-center gap-2">
              <PaginationButton disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeftIcon /></PaginationButton>
              <PaginationButton active>{page + 1}</PaginationButton>
              <PaginationButton disabled={page >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}><ChevronRightIcon /></PaginationButton>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-extrabold text-slate-950">Ghi chú Giải quyết Gần đây</h2>
          <div className="mt-6 space-y-5">
            {recentNotes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center text-sm font-semibold text-slate-500">
                Chưa có ghi chú xử lý.
              </div>
            ) : recentNotes.map((item) => (
              <article key={item.id} className="border-l-4 border-blue-700 bg-white px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-base font-extrabold text-slate-950">#{item.caseCode}: {resolutionLabels[item.resolutionType]}</h3>
                  <span className="text-xs font-semibold text-slate-500">{formatDateTime(item.resolvedAt || item.updatedAt)}</span>
                </div>
                <p className="mt-3 text-sm italic leading-7 text-slate-800">"{item.resolutionNote || item.notes?.[0]?.note}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-900">
                    {getInitials(item.resolvedByAdminName || item.notes?.[0]?.adminName || 'Admin')}
                  </div>
                  <span className="text-sm font-medium text-slate-800">Xử lý bởi: {item.resolvedByAdminName || item.notes?.[0]?.adminName || 'Admin'}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {selected ? (
        <DisputeDetailModal
          dispute={selected}
          noteText={noteText}
          submitting={submitting}
          onClose={() => setSelected(null)}
          onResolve={() => setShowResolve(true)}
          onNoteChange={setNoteText}
          onAddNote={handleAddNote}
        />
      ) : null}

      {selected && showResolve ? (
        <ResolveModal
          form={resolveForm}
          submitting={submitting}
          onChange={(field, value) => setResolveForm((prev) => ({ ...prev, [field]: value }))}
          onClose={() => setShowResolve(false)}
          onSubmit={handleResolve}
        />
      ) : null}
    </AdminLayout>
  )
}

function DisputeDetailModal({ dispute, noteText, submitting, onClose, onResolve, onNoteChange, onAddNote }: {
  dispute: AdminDispute
  noteText: string
  submitting: boolean
  onClose: () => void
  onResolve: () => void
  onNoteChange: (value: string) => void
  onAddNote: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="font-mono text-sm font-bold text-blue-700">#{dispute.caseCode}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{dispute.reason}</h2>
            <div className="mt-3 flex gap-2"><StatusBadge status={dispute.status} /></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">×</button>
        </div>
        <div className="grid gap-5 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Info label="Học viên" value={dispute.studentName || 'Chưa xác định'} />
            <Info label="Gia sư" value={dispute.tutorName || 'Chưa xác định'} />
            <Info label="Số tiền" value={formatCurrency(dispute.amount || 0)} />
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Mô tả tranh chấp</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{dispute.description}</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold text-slate-950">Bằng chứng bổ sung</p>
            <div className="space-y-3">
              {dispute.evidences.map((evidence) => (
                <div key={evidence.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-bold text-slate-950">
                      {evidence.uploadedByName}
                      {evidence.uploadedByRole ? <span className="ml-2 text-xs font-semibold text-slate-400">{evidence.uploadedByRole}</span> : null}
                    </p>
                    <span className="text-xs text-slate-500">{formatDateTime(evidence.createdAt)}</span>
                  </div>
                  {evidence.note ? <p className="mt-2 text-sm leading-6 text-slate-700">{evidence.note}</p> : null}
                  {evidence.fileUrl ? (
                    <a
                      href={evidence.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-sm font-bold text-blue-700 hover:underline"
                    >
                      Mở bằng chứng
                    </a>
                  ) : null}
                </div>
              ))}
              {dispute.evidences.length === 0 ? <p className="text-sm text-slate-500">Chưa có bằng chứng bổ sung.</p> : null}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-slate-950">Ghi chú xử lý</p>
            <div className="space-y-3">
              {dispute.notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-bold text-slate-950">{note.adminName}</p>
                    <span className="text-xs text-slate-500">{formatDateTime(note.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{note.note}</p>
                </div>
              ))}
              {dispute.notes.length === 0 ? <p className="text-sm text-slate-500">Chưa có ghi chú.</p> : null}
            </div>
          </div>
          <textarea value={noteText} onChange={(event) => onNoteChange(event.target.value)} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Thêm ghi chú nội bộ..." />
          <div className="flex justify-end gap-3">
            <button onClick={onAddNote} disabled={submitting || !noteText.trim()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50">Thêm ghi chú</button>
            <button onClick={onResolve} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">Giải quyết</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResolveModal({ form, submitting, onChange, onClose, onSubmit }: {
  form: { status: DisputeStatus; resolutionType: DisputeResolutionType; resolutionNote: string }
  submitting: boolean
  onChange: (field: 'status' | 'resolutionType' | 'resolutionNote', value: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-950">Cập nhật kết quả tranh chấp</h2>
        <div className="mt-5 grid gap-4">
          <FormSelect label="Trạng thái" value={form.status} onChange={(value) => onChange('status', value)} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} />
          <FormSelect label="Kết quả xử lý" value={form.resolutionType} onChange={(value) => onChange('resolutionType', value)} options={Object.entries(resolutionLabels).map(([value, label]) => ({ value, label }))} />
          <textarea value={form.resolutionNote} onChange={(event) => onChange('resolutionNote', event.target.value)} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Ghi rõ lý do xử lý..." />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Hủy</button>
          <button onClick={onSubmit} disabled={submitting} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Lưu kết quả</button>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, suffix, trend, note, icon, progress, segmented }: {
  label: string; value: string; suffix?: string; trend?: string; note?: string; icon: ReactNode; progress?: number; segmented?: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
      <div className="absolute right-6 top-6 text-blue-100 [&_svg]:h-16 [&_svg]:w-16">{icon}</div>
      <p className="relative text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className="relative mt-4 flex items-end gap-3">
        <span className="text-4xl font-extrabold tracking-tight text-slate-950">{value}</span>
        {suffix ? <span className="mb-2 text-sm font-medium text-slate-700">{suffix}</span> : null}
        {trend ? <span className="mb-2 text-sm font-bold text-blue-700">{trend}</span> : null}
      </div>
      {note ? <p className="relative mt-5 text-sm italic text-slate-700">{note}</p> : null}
      {progress ? (
        <div className="relative mt-6">
          {segmented ? <div className="flex gap-1.5">{[0, 1, 2, 3, 4].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item < 4 ? 'bg-blue-700' : 'bg-slate-200'}`} />)}</div>
            : <div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-700" style={{ width: `${progress}%` }} /></div>}
        </div>
      ) : null}
    </div>
  )
}

function UserCell({ name }: { name: string }) {
  return <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-slate-900">{getInitials(name)}</div><span className="text-sm font-medium leading-6 text-slate-950">{name}</span></div>
}

function StatusBadge({ status }: { status: DisputeStatus }) {
  const styles: Record<DisputeStatus, string> = {
    PENDING: 'bg-rose-100 text-rose-800',
    REVIEWING: 'bg-amber-100 text-amber-800',
    NEED_EVIDENCE: 'bg-orange-100 text-orange-800',
    RESOLVED: 'bg-emerald-100 text-emerald-800',
    REFUNDED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-slate-100 text-slate-700',
    CLOSED: 'bg-slate-100 text-slate-700',
  }
  return <span className={`inline-flex min-w-28 items-center justify-center rounded-xl px-3 py-2 text-xs font-extrabold uppercase ${styles[status]}`}>{statusLabels[status]}</span>
}

function TableHead({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return <th className={`px-6 py-4 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-700 ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return <label><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><FilterSelect value={value} onChange={onChange} options={options} /></label>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-950">{value}</p></div>
}

function PaginationButton({ children, active, disabled, onClick }: { children: ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-bold ${active ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45'}`}>{children}</button>
}

function formatCurrency(value: number) { return `${Number(value || 0).toLocaleString('vi-VN')}đ` }
function formatCompactMoney(value: number) {
  if (!value) return '0'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  return `${Math.round(value / 1000)}K`
}
function formatDateTime(value: string | null) { return value ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : 'Chưa có' }
function getInitials(name: string) { return name.split(' ').filter(Boolean).slice(-2).map((part) => part[0]?.toUpperCase()).join('') }

function Svg({ children, className = 'h-5 w-5' }: { children: ReactNode; className?: string }) { return <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">{children}</svg> }
function SearchIcon(props: { className?: string }) { return <Svg {...props}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg> }
function DownloadIcon() { return <Svg><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></Svg> }
function ClipboardIcon() { return <Svg><path d="M9 5h6" /><path d="M9 3h6a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1V5a2 2 0 0 1 2-2Z" /></Svg> }
function MoneyIcon() { return <Svg><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></Svg> }
function CheckBadgeIcon() { return <Svg><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></Svg> }
function EyeIcon() { return <Svg><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Svg> }
function GavelIcon() { return <Svg><path d="m14 4 6 6M4 14l6 6M11 7l6 6M7 11l6 6M3 21h8" /></Svg> }
function ChevronLeftIcon() { return <Svg><path d="m15 18-6-6 6-6" /></Svg> }
function ChevronRightIcon() { return <Svg><path d="m9 18 6-6-6-6" /></Svg> }
