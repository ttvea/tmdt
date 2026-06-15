import { useState } from 'react'
import { enroll, confirmPayment } from '../api/classApi'
import { createPayment } from '../api/payment'

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

  if (!isOpen) return null

  const handleEnroll = async (method: 'vnpay' | 'cash') => {
    setStep('processing')
    try {
      // Step 1: Enroll into class — backend tự tạo Order luôn
      const enrollment = await enroll(classId)
      const enrollmentId = enrollment.id
      const orderId = enrollment.orderId
      console.log('[Enrollment] Created enrollment:', enrollmentId, 'orderId:', orderId)

      if (method === 'cash') {
        // Cash: enrollment is PENDING, wait for tutor to approve
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

      // First confirm payment to set enrollment status to PAID
      try {
        await confirmPayment(enrollmentId)
      } catch (confirmErr: any) {
        // If confirmPayment fails, try to create VNPAY order directly
        console.log('[Enrollment] confirmPayment failed, trying VNPAY order flow:', confirmErr)
      }

      // Create VNPAY payment URL — dùng orderId, không phải enrollmentId
      const paymentResult = await createPayment(orderId)
      const paymentUrl = paymentResult.paymentUrl

      if (paymentUrl) {
        // Redirect to VNPAY
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
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
              <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Học phí</span>
                  <span className="font-bold text-blue-700">{formatPrice(budget)}</span>
                </div>
                {totalSessions && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Số buổi</span>
                    <span className="font-semibold">{totalSessions} buổi</span>
                  </div>
                )}
              </div>

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
