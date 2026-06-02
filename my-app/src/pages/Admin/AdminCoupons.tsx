import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  createAdminVoucher,
  getAdminVouchers,
  getCurrentAdmin,
  updateAdminVoucher,
  updateAdminVoucherStatus,
  type AdminSession,
  type AdminVoucher,
  type DiscountType,
} from '../../api/admin'
import { AdminLayout } from '../../components/AdminLayout'

const PAGE_SIZE = 10

type VoucherForm = {
  code: string
  discountType: DiscountType
  discountValue: string
  minPrice: string
  maxDiscount: string
  usageLimit: string
  startDate: string
  endDate: string
}

const initialForm: VoucherForm = {
  code: '',
  discountType: 'PERCENT',
  discountValue: '',
  minPrice: '',
  maxDiscount: '',
  usageLimit: '',
  startDate: '',
  endDate: '',
}

export function AdminCoupons() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([])
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucher | null>(null)
  const [form, setForm] = useState<VoucherForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState('')

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
    if (checking) return
    loadVouchers()
  }, [checking, page])

  const loadVouchers = () => {
    setLoading(true)
    getAdminVouchers({ page, size: PAGE_SIZE })
      .then((data) => {
        setVouchers(data.content)
        setTotalElements(data.totalElements)
        setTotalPages(Math.max(1, data.totalPages))
      })
      .catch(() => {
        setVouchers([])
        setTotalElements(0)
        setTotalPages(1)
      })
      .finally(() => setLoading(false))
  }

  const activeCount = vouchers.filter((voucher) => voucher.active && !isExpired(voucher)).length
  const expiredCount = vouchers.filter(isExpired).length
  const totalUsed = vouchers.reduce((sum, voucher) => sum + (voucher.usedCount ?? 0), 0)

  const statCards = useMemo(
    () => [
      {
        label: 'Mã toàn hệ thống',
        value: totalElements,
        detail: 'Admin tạo',
        icon: <TicketIcon />,
        iconClass: 'bg-blue-100 text-blue-700',
      },
      {
        label: 'Đang hoạt động',
        value: activeCount,
        detail: 'Có thể áp dụng',
        icon: <PulseIcon />,
        iconClass: 'bg-green-100 text-green-700',
      },
      {
        label: 'Đã hết hạn',
        value: expiredCount,
        detail: 'Trong trang hiện tại',
        icon: <ClockIcon />,
        iconClass: 'bg-amber-100 text-amber-700',
      },
      {
        label: 'Lượt sử dụng',
        value: totalUsed,
        detail: 'Trong trang hiện tại',
        icon: <ChartIcon />,
        iconClass: 'bg-slate-100 text-slate-700',
      },
    ],
    [activeCount, expiredCount, totalElements, totalUsed],
  )

  const updateField = <K extends keyof VoucherForm>(key: K, value: VoucherForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const openCreateModal = () => {
    setForm(initialForm)
    setEditingVoucher(null)
    setError('')
    setShowCreateModal(true)
  }

  const openEditModal = (voucher: AdminVoucher) => {
    setForm(voucherToForm(voucher))
    setEditingVoucher(voucher)
    setError('')
    setShowCreateModal(true)
  }

  const handleSaveVoucher = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const discountValue = Number(form.discountValue)
    if (!form.code.trim() || !discountValue || discountValue <= 0) {
      setError('Vui lòng nhập mã và giá trị giảm hợp lệ.')
      return
    }

    if (form.discountType === 'PERCENT' && discountValue > 100) {
      setError('Phần trăm giảm không được vượt quá 100%.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue,
        minPrice: toOptionalNumber(form.minPrice),
        maxDiscount: toOptionalNumber(form.maxDiscount),
        usageLimit: toOptionalNumber(form.usageLimit),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      }

      if (editingVoucher) {
        const updated = await updateAdminVoucher(editingVoucher.id, payload)
        setVouchers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      } else {
        await createAdminVoucher(payload)
        setPage(0)
        loadVouchers()
      }

      setShowCreateModal(false)
      setEditingVoucher(null)
      setForm(initialForm)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || (editingVoucher ? 'Không thể cập nhật mã giảm giá.' : 'Không thể tạo mã giảm giá.'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (voucher: AdminVoucher) => {
    setUpdatingId(voucher.id)
    try {
      const updated = await updateAdminVoucherStatus(voucher.id, !voucher.active)
      setVouchers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch {
      setError('Không thể cập nhật trạng thái mã giảm giá.')
      setShowCreateModal(true)
    } finally {
      setUpdatingId(null)
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
    <AdminLayout activePath="/admin/coupons" adminName={admin?.fullName}>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="grid gap-6 border-b border-blue-100 bg-blue-50/70 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div role="heading" aria-level={1} className="text-2xl font-bold text-blue-900">
                Tài chính & Mã giảm giá
              </div>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
            >
              <PlusIcon /> Tạo mã giảm giá mới
            </button>
          </div>

          <div className="grid gap-0 divide-y divide-slate-100 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <MiniMetric label="Phạm vi" value="PLATFORM" note="Áp dụng toàn hệ thống" />
            <MiniMetric label="Mã khả dụng" value={activeCount.toLocaleString('vi-VN')} note="Đang hoạt động" />
            <MiniMetric label="Lượt dùng" value={totalUsed.toLocaleString('vi-VN')} note="Trong trang hiện tại" />
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.label} card={card} />
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-slate-50/80 p-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-950">Danh sách mã giảm giá</p>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">PLATFORM</span>
              </div>
            </div>
            <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <DownloadIcon /> Xuất CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="border-b border-blue-200 bg-blue-50">
                <tr>
                  <TableHead>Mã</TableHead>
                  <TableHead>Giảm giá</TableHead>
                  <TableHead>Điều kiện</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Lượt dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                      Đang tải danh sách mã giảm giá...
                    </td>
                  </tr>
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                      Chưa có mã giảm giá toàn hệ thống.
                    </td>
                  </tr>
                ) : (
                  vouchers.map((voucher) => (
                    <VoucherRow
                      key={voucher.id}
                      voucher={voucher}
                      updating={updatingId === voucher.id}
                      onToggle={() => handleToggleStatus(voucher)}
                      onEdit={() => openEditModal(voucher)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm text-slate-600">
              Tổng số {totalElements.toLocaleString('vi-VN')} mã giảm giá
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-2 text-xs font-bold text-blue-700">
                {page + 1} <span className="font-medium text-slate-500">/ {totalPages}</span>
              </span>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Tiếp
              </button>
            </div>
          </div>
        </section>
      </div>

      {showCreateModal ? (
        <CreateVoucherModal
          form={form}
          error={error}
          saving={saving}
          editing={Boolean(editingVoucher)}
          onChange={updateField}
          onClose={() => {
            if (saving) return
            setShowCreateModal(false)
            setEditingVoucher(null)
            setError('')
          }}
          onSubmit={handleSaveVoucher}
        />
      ) : null}
    </AdminLayout>
  )
}

function StatCard({
  card,
}: {
  card: {
    label: string
    value: number
    detail: string
    icon: ReactNode
    iconClass: string
  }
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${card.iconClass.replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[0]}`} />
      <div className="flex items-start justify-between pt-1">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg [&_svg]:h-5 [&_svg]:w-5 ${card.iconClass}`}>
          {card.icon}
        </div>
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">{card.label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{card.value.toLocaleString('vi-VN')}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{card.detail}</p>
    </article>
  )
}

function MiniMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="px-6 py-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-slate-950">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-500">{note}</p>
    </div>
  )
}

function VoucherRow({
  voucher,
  updating,
  onToggle,
  onEdit,
}: {
  voucher: AdminVoucher
  updating: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  const expired = isExpired(voucher)
  const active = voucher.active && !expired
  const codeClass = active
    ? 'border-green-200 bg-green-50 text-green-800'
    : expired
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-slate-200 bg-slate-100 text-slate-600'

  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-6 py-4">
        <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 ${codeClass}`}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 shadow-sm">
            <TicketIcon />
          </span>
          <span className="font-mono text-sm font-bold">{voucher.code}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
        {formatDiscount(voucher)}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        <div>Đơn tối thiểu: {formatMoney(voucher.minPrice)}</div>
        <div>Giảm tối đa: {formatMoney(voucher.maxDiscount)}</div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        <div>{formatDate(voucher.startDate) || 'Không giới hạn'}</div>
        <div className="text-xs text-slate-400">đến {formatDate(voucher.endDate) || 'Không giới hạn'}</div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {(voucher.usedCount ?? 0).toLocaleString('vi-VN')} / {voucher.usageLimit?.toLocaleString('vi-VN') ?? '∞'}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
            active
              ? 'bg-green-100 text-green-800'
              : expired
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
          }`}
        >
          {active ? 'Đang hoạt động' : expired ? 'Hết hạn' : 'Đã tắt'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <ActionIconButton
            label="Sửa"
            onClick={onEdit}
            disabled={updating}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <EditIcon />
          </ActionIconButton>
          <ActionIconButton
            label={updating ? 'Đang lưu...' : voucher.active ? 'Tắt mã' : 'Bật mã'}
            onClick={onToggle}
            disabled={updating || expired}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <PowerIcon />
          </ActionIconButton>
        </div>
      </td>
    </tr>
  )
}

function ActionIconButton({
  label,
  children,
  onClick,
  disabled,
  className,
}: {
  label: string
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </button>
  )
}

function CreateVoucherModal({
  form,
  error,
  saving,
  editing,
  onChange,
  onClose,
  onSubmit,
}: {
  form: VoucherForm
  error: string
  saving: boolean
  editing: boolean
  onChange: <K extends keyof VoucherForm>(key: K, value: VoucherForm[K]) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-blue-100 bg-blue-50/80 px-6 py-5">
          <div>
            <span className="mb-2 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-bold text-blue-700 shadow-sm">
              PLATFORM
            </span>
            <h2 className="text-xl font-bold text-slate-950">{editing ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h2>
            <p className="mt-1 text-sm text-slate-600">Mã này sẽ áp dụng cho toàn hệ thống.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Mã giảm giá">
              <input value={form.code} onChange={(e) => onChange('code', e.target.value.toUpperCase())} className={inputClass} placeholder="WELCOME10" />
            </Field>
            <Field label="Loại giảm">
              <select value={form.discountType} onChange={(e) => onChange('discountType', e.target.value as DiscountType)} className={inputClass}>
                <option value="PERCENT">Phần trăm</option>
                <option value="FIXED">Số tiền cố định</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label={form.discountType === 'PERCENT' ? 'Giá trị giảm (%)' : 'Giá trị giảm (đ)'}>
              <input value={form.discountValue} onChange={(e) => onChange('discountValue', e.target.value)} className={inputClass} min="0" type="number" placeholder="10" />
            </Field>
            <Field label="Đơn tối thiểu">
              <input value={form.minPrice} onChange={(e) => onChange('minPrice', e.target.value)} className={inputClass} min="0" type="number" placeholder="0" />
            </Field>
            <Field label="Giảm tối đa">
              <input value={form.maxDiscount} onChange={(e) => onChange('maxDiscount', e.target.value)} className={inputClass} min="0" type="number" placeholder="100000" />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Lượt dùng tối đa">
              <input value={form.usageLimit} onChange={(e) => onChange('usageLimit', e.target.value)} className={inputClass} min="1" type="number" placeholder="100" />
            </Field>
            <Field label="Ngày bắt đầu">
              <input value={form.startDate} onChange={(e) => onChange('startDate', e.target.value)} className={inputClass} type="datetime-local" />
            </Field>
            <Field label="Ngày kết thúc">
              <input value={form.endDate} onChange={(e) => onChange('endDate', e.target.value)} className={inputClass} type="datetime-local" />
            </Field>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            Mã admin tạo sẽ có phạm vi `PLATFORM`, áp dụng toàn hệ thống khi học viên thanh toán.
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60">
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo mã'}
            </button>
          </div>
        </form>
        </div>
      </section>
    </div>
  )
}

const inputClass = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="mb-1 block text-sm font-bold text-slate-900">{label}</span>
      {children}
    </label>
  )
}

function TableHead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wide text-blue-800 ${className}`}>{children}</th>
}

function toOptionalNumber(value: string) {
  if (!value.trim()) return null
  return Number(value)
}

function voucherToForm(voucher: AdminVoucher): VoucherForm {
  return {
    code: voucher.code,
    discountType: voucher.discountType,
    discountValue: String(voucher.discountValue ?? ''),
    minPrice: voucher.minPrice ? String(voucher.minPrice) : '',
    maxDiscount: voucher.maxDiscount ? String(voucher.maxDiscount) : '',
    usageLimit: voucher.usageLimit ? String(voucher.usageLimit) : '',
    startDate: toDateTimeLocal(voucher.startDate),
    endDate: toDateTimeLocal(voucher.endDate),
  }
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function isExpired(voucher: AdminVoucher) {
  return Boolean(voucher.endDate && new Date(voucher.endDate) < new Date())
}

function formatDiscount(voucher: AdminVoucher) {
  if (voucher.discountType === 'PERCENT') return `${voucher.discountValue}%`
  return formatMoney(voucher.discountValue)
}

function formatMoney(value: number | null | undefined) {
  if (!value) return 'Không giới hạn'
  return value.toLocaleString('vi-VN') + 'đ'
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('response' in error)) return ''
  const data = (error as { response?: { data?: string | { message?: string } } }).response?.data
  if (typeof data === 'string') return data
  return data?.message ?? ''
}

function Svg({ children, className = 'h-5 w-5' }: { children: ReactNode; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">{children}</svg>
}
function TicketIcon() { return <Svg><path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" /><path d="M9 9h.01M15 15h.01M16 8l-8 8" /></Svg> }
function PulseIcon() { return <Svg><path d="M3 12h4l3-8 4 16 3-8h4" /></Svg> }
function ClockIcon() { return <Svg><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Svg> }
function ChartIcon() { return <Svg><path d="M4 19V5M8 17v-6M12 17V7M16 17v-4M20 19H4" /></Svg> }
function PlusIcon() { return <Svg className="h-4 w-4"><path d="M12 5v14M5 12h14" /></Svg> }
function DownloadIcon() { return <Svg className="h-4 w-4"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></Svg> }
function EditIcon() { return <Svg className="h-3.5 w-3.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg> }
function PowerIcon() { return <Svg className="h-3.5 w-3.5"><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.8 0" /></Svg> }
function CloseIcon() { return <Svg><path d="M18 6 6 18M6 6l12 12" /></Svg> }
