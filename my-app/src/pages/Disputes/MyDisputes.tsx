import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import { AccountLayout } from '../../components/AccountLayout'
import { isTutorRole } from '../../utils/userRole'
import {
  addDisputeEvidence,
  createDispute,
  getMyDispute,
  getMyDisputes,
  type DisputeCreatePayload,
} from '../../api/disputes'
import type {
  AdminDispute,
  DisputePriority,
  DisputeResolutionType,
  DisputeStatus,
} from '../../api/admin'

const PAGE_SIZE = 8

const statusLabels: Record<DisputeStatus, string> = {
  PENDING: 'Chờ xử lý',
  REVIEWING: 'Đang xem xét',
  NEED_EVIDENCE: 'Cần bổ sung bằng chứng',
  RESOLVED: 'Đã giải quyết',
  REFUNDED: 'Đã hoàn tiền',
  REJECTED: 'Bị bác bỏ',
  CLOSED: 'Đã đóng',
}

const priorityLabels: Record<DisputePriority, string> = {
  LOW: 'Thấp',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
}

const resolutionLabels: Record<DisputeResolutionType, string> = {
  NONE: 'Chưa có kết quả',
  FULL_REFUND: 'Hoàn tiền toàn bộ',
  PARTIAL_REFUND: 'Hoàn tiền một phần',
  MAKE_UP_CLASS: 'Yêu cầu học bù',
  WARNING: 'Cảnh cáo',
  REJECTED: 'Bác bỏ khiếu nại',
}

export function MyDisputes() {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const isTutor = isTutorRole(user?.role)
  const activePath = isTutor ? '/tutor/disputes' : '/student/disputes'

  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [formData, setFormData] = useState<DisputeCreatePayload>({
    reason: '',
    description: '',
    amount: null,
    priority: 'NORMAL',
    classId: null,
    respondentId: null,
  })
  const [evidenceForm, setEvidenceForm] = useState({
    note: '',
    fileUrl: '',
  })

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      window.location.href = '/login'
      return
    }
  }, [])

  useEffect(() => {
    loadDisputes()
  }, [page])

  const stats = useMemo(() => {
    const active = disputes.filter((item) => ['PENDING', 'REVIEWING', 'NEED_EVIDENCE'].includes(item.status)).length
    const refunded = disputes.filter((item) => item.status === 'REFUNDED').length
    const closed = disputes.filter((item) => ['RESOLVED', 'REJECTED', 'CLOSED'].includes(item.status)).length
    return { active, refunded, closed }
  }, [disputes])

  async function loadDisputes() {
    setLoading(true)
    try {
      const data = await getMyDisputes({ page, size: PAGE_SIZE })
      setDisputes(data.content)
      setTotalPages(Math.max(1, data.totalPages))
      setTotalElements(data.totalElements)
      if (!selectedDispute && data.content.length > 0) {
        openDispute(data.content[0], false)
      }
    } catch {
      setDisputes([])
      setTotalPages(1)
      setTotalElements(0)
      toast.error('Không thể tải danh sách tranh chấp.')
    } finally {
      setLoading(false)
    }
  }

  async function openDispute(dispute: AdminDispute, showError = true) {
    try {
      const detail = await getMyDispute(dispute.id)
      setSelectedDispute(detail)
      setEvidenceForm({ note: '', fileUrl: '' })
    } catch {
      if (showError) toast.error('Không thể tải chi tiết tranh chấp.')
    }
  }

  async function handleAddEvidence() {
    if (!selectedDispute) return

    if (!evidenceForm.note.trim() && !evidenceForm.fileUrl.trim()) {
      toast.error('Vui lòng nhập ghi chú hoặc link bằng chứng.')
      return
    }

    setSubmitting(true)
    try {
      const updated = await addDisputeEvidence(selectedDispute.id, {
        note: evidenceForm.note.trim() || null,
        fileUrl: evidenceForm.fileUrl.trim() || null,
        fileType: evidenceForm.fileUrl.trim() ? 'LINK' : null,
      })
      setSelectedDispute(updated)
      setDisputes((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated, notes: item.notes, evidences: item.evidences } : item)))
      setEvidenceForm({ note: '', fileUrl: '' })
      toast.success('Đã gửi bằng chứng bổ sung.')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gửi bằng chứng.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateDispute(event: FormEvent) {
    event.preventDefault()

    if (!formData.reason.trim() || !formData.description.trim()) {
      toast.error('Vui lòng nhập lý do và mô tả tranh chấp.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createDispute({
        ...formData,
        reason: formData.reason.trim(),
        description: formData.description.trim(),
        amount: formData.amount ? Number(formData.amount) : null,
        classId: formData.classId ? Number(formData.classId) : null,
        respondentId: formData.respondentId ? Number(formData.respondentId) : null,
      })
      toast.success('Đã gửi tranh chấp. Admin sẽ xem xét và phản hồi kết quả.')
      setFormData({
        reason: '',
        description: '',
        amount: null,
        priority: 'NORMAL',
        classId: null,
        respondentId: null,
      })
      setPage(0)
      await loadDisputes()
      await openDispute(created, false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo tranh chấp.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AccountLayout activePath={activePath}>
      <div className="min-h-screen bg-slate-50 px-8 py-8 text-left">
        <div className="mx-auto flex max-w-6xl flex-col gap-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-blue-900">Tranh chấp của tôi</p>
            </div>
            <button
              type="button"
              onClick={loadDisputes}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
            >
              <RefreshIcon /> Làm mới
            </button>
          </div>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard label="Tổng tranh chấp" value={totalElements} detail="Case đã gửi" icon={<GavelIcon />} tone="from-blue-600 to-cyan-500" />
            <StatCard label="Đang xử lý" value={stats.active} detail="Admin đang xem xét" icon={<ClockIcon />} tone="from-violet-600 to-blue-500" />
            <StatCard label="Hoàn tiền" value={stats.refunded} detail="Case đã hoàn tiền" icon={<MoneyIcon />} tone="from-emerald-600 to-teal-500" />
            <StatCard label="Đã kết thúc" value={stats.closed} detail="Case đã có kết quả" icon={<CheckIcon />} tone="from-slate-700 to-slate-500" />
          </section>

          <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Tạo tranh chấp mới</h2>
              <form className="mt-5 grid gap-4" onSubmit={handleCreateDispute}>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Lý do</label>
                  <input
                    value={formData.reason}
                    onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Ví dụ: Gia sư không xuất hiện"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <NumberField
                    label="ID lớp liên quan"
                    value={formData.classId ?? ''}
                    onChange={(value) => setFormData((prev) => ({ ...prev, classId: value ? Number(value) : null }))}
                    placeholder="Không bắt buộc"
                  />
                  <NumberField
                    label="ID người liên quan"
                    value={formData.respondentId ?? ''}
                    onChange={(value) => setFormData((prev) => ({ ...prev, respondentId: value ? Number(value) : null }))}
                    placeholder={isTutor ? 'ID học viên' : 'ID gia sư'}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <NumberField
                    label="Số tiền tranh chấp"
                    value={formData.amount ?? ''}
                    onChange={(value) => setFormData((prev) => ({ ...prev, amount: value ? Number(value) : null }))}
                    placeholder="Ví dụ: 800000"
                  />
                  <FormSelect
                    label="Mức độ"
                    value={formData.priority ?? 'NORMAL'}
                    onChange={(value) => setFormData((prev) => ({ ...prev, priority: value as DisputePriority }))}
                    options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Mô tả chi tiết</label>
                  <textarea
                    value={formData.description}
                    onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                    rows={6}
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Mô tả sự việc, thời gian xảy ra, bằng chứng bạn có..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SendIcon /> Gửi tranh chấp
                </button>
              </form>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(360px,1.12fr)]">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-blue-200 bg-blue-50 px-5 py-4">
                  <p className="text-sm font-bold text-blue-900">Danh sách tranh chấp</p>
                </div>

                <div className="max-h-[640px] overflow-y-auto">
                  {disputes.map((dispute) => (
                    <button
                      type="button"
                      key={dispute.id}
                      onClick={() => openDispute(dispute)}
                      className={`w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                        selectedDispute?.id === dispute.id ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold text-blue-700">#{dispute.caseCode}</p>
                          <p className="mt-1 truncate text-sm font-bold text-slate-950">{dispute.reason}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{formatCurrency(dispute.amount || 0)} · {formatDate(dispute.createdAt)}</p>
                        </div>
                        <StatusBadge status={dispute.status} />
                      </div>
                    </button>
                  ))}

                  {!loading && disputes.length === 0 && (
                    <div className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                      Bạn chưa gửi tranh chấp nào.
                    </div>
                  )}

                  {loading && (
                    <div className="px-5 py-12 text-center text-sm font-semibold text-slate-500">
                      Đang tải danh sách tranh chấp...
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

              <DisputeDetail
                dispute={selectedDispute}
                evidenceForm={evidenceForm}
                submitting={submitting}
                onEvidenceChange={(field, value) => setEvidenceForm((prev) => ({ ...prev, [field]: value }))}
                onAddEvidence={handleAddEvidence}
              />
            </section>
          </div>
        </div>
      </div>
    </AccountLayout>
  )
}

function DisputeDetail({
  dispute,
  evidenceForm,
  submitting,
  onEvidenceChange,
  onAddEvidence,
}: {
  dispute: AdminDispute | null
  evidenceForm: { note: string; fileUrl: string }
  submitting: boolean
  onEvidenceChange: (field: 'note' | 'fileUrl', value: string) => void
  onAddEvidence: () => void
}) {
  if (!dispute) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 [&_svg]:h-7 [&_svg]:w-7">
          <GavelIcon />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-950">Chọn tranh chấp để xem chi tiết</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Kết quả xử lý, ghi chú từ admin và trạng thái tranh chấp sẽ hiển thị tại đây.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="font-mono text-xs font-bold text-blue-700">#{dispute.caseCode}</p>
        <h2 className="mt-1 text-lg font-bold text-slate-950">{dispute.reason}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={dispute.status} />
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">{priorityLabels[dispute.priority]}</span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Học viên" value={dispute.studentName || 'Chưa xác định'} />
          <Info label="Gia sư" value={dispute.tutorName || 'Chưa xác định'} />
          <Info label="Lớp học" value={dispute.classTitle || 'Chưa liên kết'} />
          <Info label="Số tiền" value={formatCurrency(dispute.amount || 0)} />
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Mô tả ban đầu</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{dispute.description}</p>
          <p className="mt-3 text-xs font-semibold text-slate-400">Gửi lúc {formatDateTime(dispute.createdAt)}</p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Kết quả xử lý</p>
          <p className="mt-2 text-sm font-bold text-blue-950">{resolutionLabels[dispute.resolutionType]}</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
            {dispute.resolutionNote || 'Admin chưa cập nhật kết quả xử lý.'}
          </p>
          {dispute.resolvedByAdminName ? (
            <p className="mt-3 text-xs font-semibold text-blue-700">Xử lý bởi {dispute.resolvedByAdminName}</p>
          ) : null}
        </div>

        {dispute.status === 'NEED_EVIDENCE' ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-900">Admin cần bạn bổ sung bằng chứng</p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Hãy gửi thêm mô tả, ảnh chụp màn hình, biên lai hoặc link Google Drive/Zoom/Meet liên quan.
            </p>
            <div className="mt-4 grid gap-3">
              <textarea
                value={evidenceForm.note}
                onChange={(event) => onEvidenceChange('note', event.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Mô tả bằng chứng bổ sung..."
              />
              <input
                value={evidenceForm.fileUrl}
                onChange={(event) => onEvidenceChange('fileUrl', event.target.value)}
                className="h-10 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Dán link bằng chứng nếu có"
              />
              <button
                type="button"
                onClick={onAddEvidence}
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SendIcon /> Gửi bằng chứng
              </button>
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-3 text-sm font-bold text-slate-950">Bằng chứng đã gửi</p>
          <div className="space-y-3">
            {dispute.evidences.map((evidence) => (
              <div key={evidence.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-950">{evidence.uploadedByName}</p>
                  <span className="text-xs font-semibold text-slate-400">{formatDateTime(evidence.createdAt)}</span>
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
            {dispute.evidences.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
                Chưa có bằng chứng bổ sung.
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold text-slate-950">Ghi chú từ admin</p>
          <div className="space-y-3">
            {dispute.notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-950">{note.adminName}</p>
                  <span className="text-xs font-semibold text-slate-400">{formatDateTime(note.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{note.note}</p>
              </div>
            ))}
            {dispute.notes.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
                Chưa có ghi chú xử lý.
              </div>
            )}
          </div>
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

function NumberField({ label, value, onChange, placeholder }: { label: string; value: number | string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        placeholder={placeholder}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: DisputeStatus }) {
  const className: Record<DisputeStatus, string> = {
    PENDING: 'bg-rose-50 text-rose-700',
    REVIEWING: 'bg-amber-50 text-amber-700',
    NEED_EVIDENCE: 'bg-orange-50 text-orange-700',
    RESOLVED: 'bg-emerald-50 text-emerald-700',
    REFUNDED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-slate-100 text-slate-600',
    CLOSED: 'bg-slate-100 text-slate-600',
  }

  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${className[status]}`}>
      {statusLabels[status]}
    </span>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  )
}

function formatCurrency(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`
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
function GavelIcon() { return <Svg><path d="m14 4 6 6M4 14l6 6M11 7l6 6M7 11l6 6M3 21h8" /></Svg> }
function ClockIcon() { return <Svg><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Svg> }
function MoneyIcon() { return <Svg><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></Svg> }
function CheckIcon() { return <Svg><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></Svg> }
function SendIcon() { return <Svg><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></Svg> }
