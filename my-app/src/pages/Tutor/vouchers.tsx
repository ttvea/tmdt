import { useEffect, useMemo, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { getMyClasses, type ClassResponse } from '../../api/classApi'
import {
  createVoucher,
  deleteVoucher,
  getMyVouchers,
  updateVoucherStatus,
  type DiscountType,
  type VoucherRequest,
  type VoucherResponse,
  type VoucherScope,
} from '../../api/voucherApi'

type VoucherForm = {
  code: string
  discountType: DiscountType
  discountValue: string
  minPrice: string
  maxDiscount: string
  usageLimit: string
  applicableScope: VoucherScope
  classId: string
  startDate: string
  endDate: string
}

const emptyForm: VoucherForm = {
  code: '',
  discountType: 'PERCENT',
  discountValue: '',
  minPrice: '',
  maxDiscount: '',
  usageLimit: '',
  applicableScope: 'ALL_CLASSES',
  classId: '',
  startDate: '',
  endDate: '',
}

function toNumber(value: string) {
  return value.trim() ? Number(value) : null
}

function toDateTime(value: string, endOfDay = false) {
  if (!value) return null
  return `${value}T${endOfDay ? '23:59:59' : '00:00:00'}`
}

function formatMoney(value: number | null | undefined) {
  if (value == null) return '-'
  return `${value.toLocaleString('vi-VN')}đ`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

function getVoucherStatus(voucher: VoucherResponse) {
  if (!voucher.active) return { label: 'Đã ẩn', className: 'bg-slate-100 text-slate-500' }
  if (voucher.endDate && new Date(voucher.endDate).getTime() < Date.now()) {
    return { label: 'Hết hạn', className: 'bg-rose-50 text-rose-600' }
  }
  return { label: 'Hoạt động', className: 'bg-emerald-50 text-emerald-600' }
}

function isVoucherExpired(voucher: VoucherResponse) {
  return Boolean(voucher.endDate && new Date(voucher.endDate).getTime() < Date.now())
}

function classScopeLabel(voucher: VoucherResponse, classMap: Map<number, string>) {
  if (voucher.applicableScope === 'ALL_CLASSES') return 'Tất cả lớp học'
  if (!voucher.classId) return 'Lớp cụ thể'
  return classMap.get(voucher.classId) ?? `Lớp #${voucher.classId}`
}

function VoucherPreviewCard({
  code,
  discountType,
  discountValue,
  usageLimit,
  minPrice,
  maxDiscount,
  classLabel,
  endDate,
  statusLabel,
}: {
  code: string
  discountType: DiscountType
  discountValue: number | string
  usageLimit?: number | string | null
  minPrice?: number | string | null
  maxDiscount?: number | string | null
  classLabel?: string
  endDate?: string | null
  statusLabel?: string
}) {
  const displayValue = discountType === 'PERCENT'
    ? `${discountValue || 0}%`
    : `${Number(discountValue || 0).toLocaleString('vi-VN')}đ`

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-blue-100 px-5 py-4">
        <span className="text-sm font-bold uppercase tracking-wide text-slate-700">Xem trước mã</span>
        <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5s8.577 3.01 9.964 7.183c.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5s-8.577-3.01-9.964-7.178Z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </div>
      <div className="p-5">
        <div className="relative overflow-hidden rounded-lg bg-blue-700 px-5 py-7 text-center text-white">
          <div className="absolute left-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-r-full bg-white" />
          <div className="absolute right-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-l-full bg-white" />
          <p className="text-xs font-bold uppercase">Mã giảm giá EduMatch Pro</p>
          <div className="my-4 break-all border-y border-dashed border-white/50 px-4 py-3 text-2xl font-bold tracking-[0.08em]">
            {code.toUpperCase()}
          </div>
          <p className="text-2xl font-bold">
            {discountType === 'PERCENT' ? `-${discountValue || 0}%` : `-${Number(discountValue || 0).toLocaleString('vi-VN')}đ`}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/90">Giảm ngay cho học phí</p>
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Loại:</dt>
            <dd className="font-semibold text-slate-900">{discountType === 'PERCENT' ? 'Phần trăm' : 'Số tiền'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Giá trị:</dt>
            <dd className="font-semibold text-slate-900">{displayValue}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Giới hạn:</dt>
            <dd className="font-semibold text-slate-900">{usageLimit || '∞'} lượt</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Giá tối thiểu:</dt>
            <dd className="font-semibold text-slate-900">{Number(minPrice || 0).toLocaleString('vi-VN')}đ</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Giảm tối đa:</dt>
            <dd className="font-semibold text-slate-900">{maxDiscount ? `${Number(maxDiscount).toLocaleString('vi-VN')}đ` : 'Không giới hạn'}</dd>
          </div>
          {classLabel ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Áp dụng:</dt>
              <dd className="max-w-[220px] text-right font-semibold text-slate-900">{classLabel}</dd>
            </div>
          ) : null}
          {endDate ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Hạn dùng:</dt>
              <dd className="font-semibold text-slate-900">{formatDate(endDate)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-5 border-t border-slate-200 pt-4 text-xs font-bold text-blue-700">
          {statusLabel || 'Sẵn sàng kích hoạt'}
        </div>
      </div>
    </div>
  )
}

async function getRecruitingClasses() {
  const firstPage = await getMyClasses(0, 100)
  const pages = [firstPage]

  if (firstPage.totalPages > 1) {
    const restPages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        getMyClasses(index + 1, 100)
      )
    )
    pages.push(...restPages)
  }

  return pages
    .flatMap((page) => page.content)
    .filter((cls) => cls.approvalStatus === 'APPROVED' && cls.status === 'OPEN')
}

function VoucherCreatePanel({
  form,
  classes,
  saving,
  onChange,
  onSubmit,
  onClose,
}: {
  form: VoucherForm
  classes: ClassResponse[]
  saving: boolean
  onChange: (field: keyof VoucherForm, value: string) => void
  onSubmit: (event: React.FormEvent) => void
  onClose: () => void
}) {
  const previewCode = form.code.trim() || 'EDUMATCH2024'
  const previewValue = form.discountValue || '20'
  const previewLimit = form.usageLimit || '500'
  const previewMinPrice = form.minPrice || '0'
  const previewMaxDiscount = form.maxDiscount || ''

  return (
    <form onSubmit={onSubmit} className="relative flex max-h-[92vh] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng form tạo mã giảm giá"
        className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-5 p-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Tạo mã giảm giá mới</h2>
            <p className="mt-1 text-sm text-slate-500">
              Thiết lập các chương trình khuyến mãi và ưu đãi cho học viên trên EduMatch Pro.
            </p>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-600 text-xs font-bold text-blue-700">i</span>
              <h3 className="text-lg font-bold text-slate-900">Thông tin cơ bản</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Mã giảm giá</span>
                <input required value={form.code} onChange={(e) => onChange('code', e.target.value)} placeholder="Vd: EDUMATCH2024" className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Loại giảm giá</span>
                <select value={form.discountType} onChange={(e) => onChange('discountType', e.target.value as DiscountType)} className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                  <option value="PERCENT">Phần trăm (%)</option>
                  <option value="FIXED">Số tiền (VNĐ)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Giá trị giảm</span>
                <input required min="1" type="number" value={form.discountValue} onChange={(e) => onChange('discountValue', e.target.value)} placeholder="Nhập giá trị" className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Giới hạn sử dụng</span>
                <input min="1" type="number" value={form.usageLimit} onChange={(e) => onChange('usageLimit', e.target.value)} placeholder="Số lần sử dụng tối đa" className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Giá tối thiểu</span>
                <input min="0" type="number" value={form.minPrice} onChange={(e) => onChange('minPrice', e.target.value)} placeholder="Vd: 500000" className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Giảm tối đa</span>
                <input min="0" type="number" value={form.maxDiscount} onChange={(e) => onChange('maxDiscount', e.target.value)} placeholder="Vd: 100000" className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M4 11h16M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">Thời hạn & Trạng thái</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Ngày bắt đầu</span>
                <input type="date" value={form.startDate} onChange={(e) => onChange('startDate', e.target.value)} className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Ngày kết thúc</span>
                <input type="date" value={form.endDate} onChange={(e) => onChange('endDate', e.target.value)} className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
              </label>
            </div>
            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">Trạng thái kích hoạt</p>
                  <p className="text-xs text-slate-500">Cho phép mã giảm giá được sử dụng ngay lập tức.</p>
                </div>
                <span className="relative inline-flex h-6 w-11 rounded-full bg-blue-700">
                  <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">Phạm vi áp dụng</h3>
            </div>
            <div className="space-y-3">
              <label className={`flex cursor-pointer gap-3 rounded-md border p-4 ${form.applicableScope === 'ALL_CLASSES' ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                <input type="radio" checked={form.applicableScope === 'ALL_CLASSES'} onChange={() => onChange('applicableScope', 'ALL_CLASSES')} className="mt-1 h-4 w-4 accent-blue-700" />
                <span>
                  <span className="block text-sm font-bold text-slate-900">Tất cả lớp học</span>
                  <span className="text-xs text-slate-500">Mã giảm giá có thể áp dụng cho mọi lớp học của bạn.</span>
                </span>
              </label>
              <label className={`flex cursor-pointer gap-3 rounded-md border p-4 ${form.applicableScope === 'SPECIFIC_CLASS' ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                <input type="radio" checked={form.applicableScope === 'SPECIFIC_CLASS'} onChange={() => onChange('applicableScope', 'SPECIFIC_CLASS')} className="mt-1 h-4 w-4 accent-blue-700" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900">Lớp học cụ thể</span>
                  <span className="text-xs text-slate-500">Chỉ áp dụng cho một lớp học được chọn.</span>
                  {form.applicableScope === 'SPECIFIC_CLASS' ? (
                    <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
                      {classes.length === 0 ? (
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500">
                          Không có lớp đang tuyển sinh
                        </div>
                      ) : (
                        classes.map((cls) => {
                          const selected = form.classId === String(cls.id)
                          return (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => onChange('classId', String(cls.id))}
                              className={`flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition ${
                                selected
                                  ? 'border-blue-300 bg-blue-50 text-blue-900'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40'
                              }`}
                            >
                              <span className={`mt-0.5 h-4 w-4 rounded-full border ${selected ? 'border-blue-700 bg-blue-700 shadow-[inset_0_0_0_3px_white]' : 'border-slate-300'}`} />
                              <span className="min-w-0">
                                <span className="line-clamp-1 block text-sm font-bold">{cls.title}</span>
                                <span className="mt-1 block text-xs text-slate-500">
                                  {cls.subjectName || 'Môn học'} • {cls.gradeLevelName || 'Cấp học'} • Đang tuyển sinh
                                </span>
                              </span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  ) : null}
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className="border-l border-slate-200 bg-slate-50 p-6">
          <VoucherPreviewCard
            code={previewCode}
            discountType={form.discountType}
            discountValue={previewValue}
            usageLimit={previewLimit}
            minPrice={previewMinPrice}
            maxDiscount={previewMaxDiscount}
          />
        </aside>
      </div>

      <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
        <button type="button" onClick={onClose} className="h-10 rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Hủy bỏ
        </button>
        <button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13 9 17 19 7" />
          </svg>
          {saving ? 'Đang lưu...' : 'Lưu mã giảm giá'}
        </button>
      </div>
    </form>
  )
}

export function TutorVouchers() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([])
  const [classes, setClasses] = useState<ClassResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<VoucherForm>(emptyForm)
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherResponse | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const classMap = useMemo(() => {
    return new Map(classes.map((cls) => [cls.id, cls.title]))
  }, [classes])

  const visibleVouchers = useMemo(() => {
    return [...vouchers].sort((a, b) => b.id - a.id)
  }, [vouchers])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const voucherData = await getMyVouchers()
      setVouchers(voucherData)
    } catch {
      setError('Không thể tải danh sách mã giảm giá.')
    }

    try {
      const recruitingClasses = await getRecruitingClasses()
      setClasses(recruitingClasses)
    } catch {
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!success) return

    const timer = window.setTimeout(() => setSuccess(''), 3000)
    return () => window.clearTimeout(timer)
  }, [success])

  const openCreateForm = () => {
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  const closeCreateForm = () => {
    setError('')
    setSuccess('')
    setShowForm(false)
  }

  const handleChange = (field: keyof VoucherForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'applicableScope' && value === 'ALL_CLASSES' ? { classId: '' } : {}),
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const request: VoucherRequest = {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minPrice: toNumber(form.minPrice),
        maxDiscount: toNumber(form.maxDiscount),
        usageLimit: toNumber(form.usageLimit),
        applicableScope: form.applicableScope,
        classId: form.applicableScope === 'SPECIFIC_CLASS' ? Number(form.classId) : null,
        startDate: toDateTime(form.startDate),
        endDate: toDateTime(form.endDate, true),
      }

      const created = await createVoucher(request)
      setVouchers((prev) => [created, ...prev])
      setForm(emptyForm)
      setShowForm(false)
      setSuccess('Tạo mã giảm giá thành công.')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data || 'Không thể tạo mã giảm giá.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (voucher: VoucherResponse) => {
    const nextActive = !voucher.active
    const confirmed = window.confirm(
      nextActive ? 'Bạn muốn bật lại mã giảm giá này?' : 'Bạn muốn tắt mã giảm giá này?'
    )
    if (!confirmed) return

    try {
      const updatedVoucher = await updateVoucherStatus(voucher.id, nextActive)
      setVouchers((prev) =>
        prev.map((voucher) =>
          voucher.id === updatedVoucher.id ? updatedVoucher : voucher
        )
      )
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data || 'Không thể cập nhật mã giảm giá.')
    }
  }

  const handleDeleteExpired = async (voucher: VoucherResponse) => {
    const confirmed = window.confirm('Bạn muốn xóa mã giảm giá đã hết hạn này?')
    if (!confirmed) return

    try {
      await deleteVoucher(voucher.id)
      setVouchers((prev) => prev.filter((item) => item.id !== voucher.id))
      if (selectedVoucher?.id === voucher.id) setSelectedVoucher(null)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data || 'Không thể xóa mã giảm giá.')
    }
  }

  return (
    <AccountLayout activePath="/tutor/vouchers">
      <div className="min-h-screen bg-slate-50 px-8 py-8 text-left">
        <div className="mx-auto flex max-w-6xl flex-col gap-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-blue-900">Quản lý Mã giảm giá</p>
              <p className="mt-1 text-sm text-slate-500">
                Tạo và tối ưu chiến dịch giảm giá để tăng lượng học viên đăng ký.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
            >
              <span className="text-lg leading-none">+</span>
              Tạo mã mới
            </button>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <p>
              <span className="font-bold">Gợi ý:</span> Tạo mã giảm giá để thu hút học viên mới đăng ký lớp học của bạn.
              Các mã giảm giá 10-15% thường mang lại tỷ lệ chuyển đổi cao nhất.
            </p>
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {success}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-bold text-slate-950">Danh sách mã giảm giá</h2>
              <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M7 12h10m-7 6h4" />
                </svg>
                Bộ lọc
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">Mã</th>
                    <th className="px-6 py-4">Loại</th>
                    <th className="px-6 py-4">Giá trị</th>
                    <th className="px-6 py-4">Áp dụng cho</th>
                    <th className="px-6 py-4">Lượt dùng</th>
                    <th className="px-6 py-4">Hạn dùng</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Đang tải mã giảm giá...</td>
                    </tr>
                  ) : visibleVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Chưa có mã giảm giá nào.</td>
                    </tr>
                  ) : (
                    visibleVouchers.map((voucher) => {
                      const status = getVoucherStatus(voucher)
                      const expired = isVoucherExpired(voucher)
                      const usageLimit = voucher.usageLimit ?? 0
                      const progress = usageLimit > 0 ? Math.min(100, (voucher.usedCount / usageLimit) * 100) : 0

                      return (
                        <tr key={voucher.id} className="border-t border-slate-100 text-slate-700">
                          <td className="px-6 py-5">
                            <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{voucher.code}</span>
                          </td>
                          <td className="px-6 py-5">
                            {voucher.discountType === 'PERCENT' ? 'Phần trăm (%)' : 'Số tiền (VNĐ)'}
                          </td>
                          <td className="px-6 py-5 font-bold text-slate-950">
                            {voucher.discountType === 'PERCENT' ? `${voucher.discountValue}%` : formatMoney(voucher.discountValue)}
                          </td>
                          <td className="max-w-[180px] px-6 py-5">
                            <span className="line-clamp-2">{classScopeLabel(voucher, classMap)}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="w-24">
                              <div className="mb-1 text-xs font-semibold text-slate-600">
                                {voucher.usedCount}/{voucher.usageLimit ?? '∞'}
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-200">
                                <div className="h-1.5 rounded-full bg-blue-700" style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">{formatDate(voucher.endDate)}</td>
                          <td className="px-6 py-5">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-3">
                              <button type="button" title="Xem chi tiết" onClick={() => setSelectedVoucher(voucher)} className="text-slate-500 hover:text-blue-700">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5s8.577 3.01 9.964 7.183c.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5s-8.577-3.01-9.964-7.178Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                              </button>
                              <button type="button" title="Chỉnh sửa" className="text-slate-500 hover:text-blue-700">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m16.862 4.487 1.651-1.651a2.121 2.121 0 1 1 3 3L7.5 19.85 3 21l1.15-4.5L16.862 4.487z" />
                                </svg>
                              </button>
                              {expired ? (
                                <button
                                  type="button"
                                  title="Xóa mã hết hạn"
                                  onClick={() => handleDeleteExpired(voucher)}
                                  className="text-slate-500 hover:text-rose-600"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6 6 18" />
                                  </svg>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  title={voucher.active ? 'Tắt mã' : 'Bật lại mã'}
                                  onClick={() => handleToggleStatus(voucher)}
                                  className={voucher.active ? 'text-slate-500 hover:text-rose-600' : 'text-slate-500 hover:text-emerald-600'}
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {voucher.active ? (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 0 1 5.636 5.636m12.728 12.728A9 9 0 0 0 5.636 5.636m12.728 12.728L5.636 5.636" />
                                    ) : (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.5 12.75 10 18.25 19.5 5.75" />
                                    )}
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-600">
              <span>Hiển thị {visibleVouchers.length} mã giảm giá</span>
              <div className="flex gap-2">
                <button className="h-9 w-9 rounded border border-slate-200 text-slate-400">‹</button>
                <button className="h-9 w-9 rounded border border-slate-200 text-slate-900">›</button>
              </div>
            </div>
          </section>

          {showForm ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
              <div className="w-full max-w-6xl">
                <VoucherCreatePanel
                  form={form}
                  classes={classes}
                  saving={saving}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onClose={closeCreateForm}
                />
              </div>
            </div>
          ) : null}

          {selectedVoucher ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
              <div className="relative w-full max-w-md">
                <button
                  type="button"
                  onClick={() => setSelectedVoucher(null)}
                  aria-label="Đóng chi tiết mã giảm giá"
                  className="absolute -right-3 -top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
                <VoucherPreviewCard
                  code={selectedVoucher.code}
                  discountType={selectedVoucher.discountType}
                  discountValue={selectedVoucher.discountValue}
                  usageLimit={selectedVoucher.usageLimit}
                  minPrice={selectedVoucher.minPrice}
                  maxDiscount={selectedVoucher.maxDiscount}
                  classLabel={classScopeLabel(selectedVoucher, classMap)}
                  endDate={selectedVoucher.endDate}
                  statusLabel={getVoucherStatus(selectedVoucher).label}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AccountLayout>
  )
}
