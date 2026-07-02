import { useEffect, useState } from 'react'
import { enroll } from '../api/classApi'
import { getAvailableVouchers, type VoucherResponse } from '../api/voucher'

interface EnrollmentModalProps {
  isOpen: boolean
  classId: number
  classTitle: string
  budget: number | null
  totalSessions: number | null
  onClose: () => void
}

type Step = 'form' | 'processing' | 'result'

export function EnrollmentModal({
  isOpen,
  classId,
  classTitle,
  budget,
  totalSessions,
  onClose,
}: EnrollmentModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [resultMessage, setResultMessage] = useState('')
  const [resultType, setResultType] = useState<'success' | 'error'>('success')
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([])
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)
  const [showVoucherPicker, setShowVoucherPicker] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    setStep('form')
    setResultMessage('')
    setResultType('success')
    setSelectedVoucherId(null)
    setShowVoucherPicker(false)

    getAvailableVouchers(classId)
      .then(setVouchers)
      .catch(() => setVouchers([]))
  }, [classId, isOpen])

  if (!isOpen) return null

  const formatPrice = (price: number | null) => {
    if (price == null) return 'Thỏa thuận'
    return `${price.toLocaleString('vi-VN')} đ`
  }

  const selectedVoucher = selectedVoucherId
    ? vouchers.find((voucher) => voucher.id === selectedVoucherId) ?? null
    : null

  const getDiscountInfo = () => {
    if (!selectedVoucher) return null

    const discountLabel =
      selectedVoucher.discountType === 'PERCENT'
        ? `Giảm ${selectedVoucher.discountValue}%`
        : `Giảm ${selectedVoucher.discountValue.toLocaleString('vi-VN')} đ`

    let estimatedDiscount = 0
    if (budget != null) {
      estimatedDiscount =
        selectedVoucher.discountType === 'PERCENT'
          ? Math.round((budget * selectedVoucher.discountValue) / 100)
          : selectedVoucher.discountValue

      if (selectedVoucher.maxDiscount) {
        estimatedDiscount = Math.min(estimatedDiscount, selectedVoucher.maxDiscount)
      }
    }

    return { label: discountLabel, estimatedDiscount }
  }

  const discountInfo = getDiscountInfo()
  const finalAmount =
    budget != null && discountInfo
      ? Math.max(0, budget - discountInfo.estimatedDiscount)
      : budget

  const handleSubmit = async () => {
    setStep('processing')
    try {
      await enroll(classId, selectedVoucherId ?? undefined)
      setResultType('success')
      setResultMessage(
        'Đã gửi yêu cầu đăng ký học. Vui lòng chờ gia sư duyệt, sau đó bạn có thể thanh toán trong trang Thanh toán của tài khoản.'
      )
    } catch (error: any) {
      setResultType('error')
      setResultMessage(
        error?.response?.data?.message ||
          error?.message ||
          'Không thể gửi yêu cầu đăng ký. Vui lòng thử lại sau.'
      )
    } finally {
      setStep('result')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Đăng ký học</h3>
              <p className="mt-1 line-clamp-1 text-sm text-blue-50">{classTitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 'form' && (
            <>
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-600">Học phí</span>
                  <span className="font-bold text-blue-700">{formatPrice(budget)}</span>
                </div>

                {discountInfo && (
                  <>
                    <div className="mt-2 flex justify-between gap-4 text-sm">
                      <span className="text-emerald-700">{discountInfo.label}</span>
                      <span className="font-bold text-emerald-700">
                        -{discountInfo.estimatedDiscount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between gap-4 border-t border-blue-100 pt-3 text-sm">
                      <span className="font-semibold text-slate-700">Tạm tính</span>
                      <span className="font-bold text-blue-700">{formatPrice(finalAmount)}</span>
                    </div>
                  </>
                )}

                {totalSessions ? (
                  <div className="mt-2 flex justify-between gap-4 text-sm">
                    <span className="text-slate-600">Số buổi</span>
                    <span className="font-semibold text-slate-800">{totalSessions} buổi</span>
                  </div>
                ) : null}
              </div>

              {vouchers.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowVoucherPicker((value) => !value)}
                    className="flex w-full items-center justify-between rounded-xl border border-dashed border-blue-300 p-3 text-left transition hover:border-blue-500 hover:bg-blue-50"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {selectedVoucher ? `Mã giảm giá: ${selectedVoucher.code}` : 'Chọn mã giảm giá'}
                    </span>
                    <span className="text-xs font-bold text-blue-700">{showVoucherPicker ? 'Thu gọn' : 'Mở'}</span>
                  </button>

                  {showVoucherPicker && (
                    <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVoucherId(null)
                          setShowVoucherPicker(false)
                        }}
                        className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                          selectedVoucherId === null
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-medium text-slate-700">Không sử dụng mã giảm giá</span>
                      </button>

                      {vouchers.map((voucher) => (
                        <button
                          key={voucher.id}
                          type="button"
                          onClick={() => {
                            setSelectedVoucherId(voucher.id)
                            setShowVoucherPicker(false)
                          }}
                          className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                            selectedVoucherId === voucher.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold text-emerald-700">{voucher.code}</span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              {voucher.discountType === 'PERCENT'
                                ? `${voucher.discountValue}%`
                                : `${voucher.discountValue.toLocaleString('vi-VN')} đ`}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {voucher.minPrice ? `Đơn tối thiểu: ${voucher.minPrice.toLocaleString('vi-VN')} đ` : 'Không yêu cầu đơn tối thiểu'}
                            {voucher.endDate ? ` • HSD: ${new Date(voucher.endDate).toLocaleDateString('vi-VN')}` : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                Sau khi gửi yêu cầu, gia sư sẽ duyệt đăng ký của bạn. Bạn chỉ thanh toán khi yêu cầu đã được duyệt.
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
              >
                Gửi yêu cầu đăng ký
              </button>
            </>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="font-semibold text-slate-700">Đang gửi yêu cầu đăng ký...</p>
              <p className="mt-1 text-sm text-slate-500">Vui lòng chờ trong giây lát</p>
            </div>
          )}

          {step === 'result' && (
            <div className="py-8 text-center">
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${
                  resultType === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {resultType === 'success' ? '✓' : '!'}
              </div>
              <p className={`text-lg font-bold ${resultType === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {resultType === 'success' ? 'Đã gửi yêu cầu' : 'Đăng ký thất bại'}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{resultMessage}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {resultType === 'success' && (
                  <a
                    href="/student/enrollments"
                    className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Xem trạng thái
                  </a>
                )}
                <button
                  type="button"
                  onClick={resultType === 'success' ? onClose : () => setStep('form')}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {resultType === 'success' ? 'Đóng' : 'Thử lại'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
