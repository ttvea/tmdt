
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { enroll } from '../api/classApi'

import { createPayment } from '../api/payment'
import { getAvailableVouchers, type VoucherResponse } from '../api/voucher'

interface EnrollmentModalProps {
  isOpen: boolean
  classId: number
  classTitle: string
  budget: number | null
  totalSessions: number | null
  onClose: () => void
}

type Step = 'choose' | 'processing' | 'result'

export function EnrollmentModal({
  isOpen,
  classId,
  classTitle,
  budget,
  totalSessions,
  onClose,
}: EnrollmentModalProps) {
  const [step, setStep] = useState<Step>('choose')
  const [resultMessage, setResultMessage] = useState('')
  const [resultType, setResultType] = useState<'success' | 'error'>('success')
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([])
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null)
  const [showVoucherPicker, setShowVoucherPicker] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep('choose')
      setSelectedVoucherId(null)
      setShowVoucherPicker(false)
      // Fetch available vouchers
      getAvailableVouchers()
        .then(setVouchers)
        .catch(() => {})
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleEnroll = async (method: 'vnpay' | 'cash') => {
    setStep('processing')
    try {
      // Step 1: Enroll with optional voucher
      const enrollment = await enroll(classId, selectedVoucherId ?? undefined)
      const enrollmentId = enrollment.id
      const orderId = enrollment.orderId
      console.log('[Enrollment] Created enrollment:', enrollmentId, 'orderId:', orderId, 'voucherId:', selectedVoucherId)

      if (method === 'cash') {
        setStep('result')
        setResultType('success')
        setResultMessage('Đăng ký thành công! Vui lòng chờ gia sư xác nhận. Chúng tôi sẽ thông báo khi có kết quả.')
        return
      }

      // VNPAY: need to pay immediately
      if (orderId == null) {
        setStep('result')
        setResultType('error')
        setResultMessage('Không tìm thấy hóa đơn để thanh toán. Vui lòng thử lại.')
        return
      }

      const paymentResult = await createPayment(orderId)
      const paymentUrl = paymentResult.paymentUrl

      if (paymentUrl) {
        window.location.href = paymentUrl
      } else {
        setStep('result')
        setResultType('error')
        setResultMessage('Không thể tạo đường dẫn thanh toán VNPAY. Vui lòng thử lại sau.')
      }
    } catch (error: any) {
      console.error('[Enrollment] Error:', error)
      const errMsg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra, vui lòng thử lại'
      setStep('result')
      setResultType('error')
      setResultMessage(errMsg)
    }
  }

  const formatPrice = (price: number | null) => {
    if (price == null) return 'Thỏa thuận'
    return `${price.toLocaleString('vi-VN')} đ`
  }

  const getDiscountDisplay = () => {
    if (!selectedVoucherId) return null
    const v = vouchers.find((v) => v.id === selectedVoucherId)
    if (!v) return null

    let discountText = ''
    if (v.discountType === 'PERCENT') {
      discountText = `Giảm ${v.discountValue}%`
    } else {
      discountText = `Giảm ${v.discountValue.toLocaleString('vi-VN')}₫`
    }

    let estimatedDiscount = 0
    if (budget) {
      if (v.discountType === 'PERCENT') {
        estimatedDiscount = Math.round(budget * v.discountValue / 100)
      } else {
        estimatedDiscount = v.discountValue
      }
      if (v.maxDiscount) {
        estimatedDiscount = Math.min(estimatedDiscount, v.maxDiscount)
      }
    }

    return { text: discountText, estimatedDiscount, voucher: v }
  }

  const discountInfo = getDiscountDisplay()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <h3 className="text-lg font-bold">Đăng ký lớp học</h3>
          <p className="text-sm text-blue-100 mt-1 line-clamp-1">{classTitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'choose' && (
            <>
              {/* Class info summary */}
              <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Học phí gốc</span>
                  <span className="font-bold text-blue-700">{formatPrice(budget)}</span>
                </div>
                {discountInfo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">{discountInfo.text}</span>
                    <span className="font-bold text-green-600">-{discountInfo.estimatedDiscount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                {discountInfo && (
                  <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                    <span className="text-slate-600 font-semibold">Thành tiền</span>
                    <span className="font-bold text-blue-700">
                      {budget ? formatPrice(Math.max(0, budget - discountInfo.estimatedDiscount)) : formatPrice(budget)}
                    </span>
                  </div>
                )}
                {totalSessions && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Số buổi</span>
                    <span className="font-semibold">{totalSessions} buổi</span>
                  </div>
                )}
              </div>

              {/* Voucher Selector */}
              {vouchers.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowVoucherPicker(!showVoucherPicker)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏷️</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {selectedVoucherId ? 'Đã chọn mã giảm giá' : 'Chọn mã giảm giá'}
                      </span>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold">
                      {showVoucherPicker ? '▲' : '▼'}
                    </span>
                  </button>

                  {showVoucherPicker && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedVoucherId(null)
                          setShowVoucherPicker(false)
                        }}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                          selectedVoucherId === null
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-medium text-slate-700">Không sử dụng mã giảm giá</span>
                      </button>
                      {vouchers.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVoucherId(v.id)
                            setShowVoucherPicker(false)
                          }}
                          className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                            selectedVoucherId === v.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-green-700">{v.code}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                              {v.discountType === 'PERCENT' ? `${v.discountValue}%` : `${v.discountValue.toLocaleString('vi-VN')}₫`}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {v.minPrice && <span>Đơn tối thiểu: {v.minPrice.toLocaleString('vi-VN')}₫</span>}
                            {v.endDate && <span> • HSD: {new Date(v.endDate).toLocaleDateString('vi-VN')}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-slate-700 mb-4 text-center">
                Vui lòng chọn phương thức thanh toán
              </p>

              <div className="space-y-3">
                {/* VNPAY Option */}
                <button
                  onClick={() => handleEnroll('vnpay')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                    <span className="text-xl">💳</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Thanh toán VNPAY</p>
                    <p className="text-xs text-slate-500">Thanh toán trực tuyến qua VNPAY</p>
                  </div>
                  <span className="ml-auto text-blue-600 text-sm font-semibold group-hover:underline">
                    Chọn →
                  </span>
                </button>

                {/* Cash Option */}
                <button
                  onClick={() => handleEnroll('cash')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
                    <span className="text-xl">💰</span>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Thanh toán tiền mặt</p>
                    <p className="text-xs text-slate-500">Đăng ký và chờ gia sư xác nhận</p>
                  </div>
                  <span className="ml-auto text-green-600 text-sm font-semibold group-hover:underline">
                    Chọn →
                  </span>
                </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-700 font-semibold">Đang xử lý đăng ký...</p>
              <p className="text-sm text-slate-500 mt-1">Vui lòng chờ trong giây lát</p>
            </div>
          )}

          {step === 'result' && (
            <div className="py-8 text-center">
              <div className={`text-5xl mb-4 ${resultType === 'success' ? '' : ''}`}>
                {resultType === 'success' ? '✅' : '❌'}
              </div>
              <p className={`font-semibold text-lg mb-2 ${resultType === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {resultType === 'success' ? 'Đăng ký thành công!' : 'Đăng ký thất bại'}
              </p>
              <p className="text-sm text-slate-600 mb-6">{resultMessage}</p>
              <button
                onClick={onClose}
                className={`px-6 py-2 rounded-lg text-white font-semibold text-sm transition-colors ${
                  resultType === 'success'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {resultType === 'success' ? 'Đóng' : 'Thử lại'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
