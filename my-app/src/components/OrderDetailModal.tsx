import { useEffect, useState } from 'react'
import { getOrderDetail, type OrderDetailResponse } from '../api/order'

interface OrderDetailModalProps {
  isOpen: boolean
  orderId: number
  onClose: () => void
}

export function OrderDetailModal({ isOpen, orderId, onClose }: OrderDetailModalProps) {
  const [order, setOrder] = useState<OrderDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !orderId) return
    setLoading(true)
    setError('')
    getOrderDetail(orderId)
      .then(setOrder)
      .catch((err: any) => setError(err?.response?.data?.message || 'Không thể tải hóa đơn'))
      .finally(() => setLoading(false))
  }, [isOpen, orderId])

  if (!isOpen) return null

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PAID: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      EXPIRED: 'bg-slate-100 text-slate-700',
    }
    const labels: Record<string, string> = {
      PENDING: 'Chờ thanh toán',
      PAID: 'Đã thanh toán',
      CANCELLED: 'Đã hủy',
      EXPIRED: 'Hết hạn',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ'
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('vi-VN')
  }

  const enrollmentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-blue-100 text-blue-700',
      CASH_REQUESTED: 'bg-purple-100 text-purple-700',
      PAID: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-slate-100 text-slate-700',
    }
    const labels: Record<string, string> = {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      CASH_REQUESTED: 'Yêu cầu TM',
      PAID: 'Đã thanh toán',
      REJECTED: 'Từ chối',
      CANCELLED: 'Đã hủy',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || ''}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">🧾 Hóa đơn #{order?.id || orderId}</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-500 text-sm">Đang tải hóa đơn...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-600 text-sm mb-3">{error}</p>
              <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Đóng</button>
            </div>
          ) : order ? (
            <div className="space-y-4">
              {/* Invoice Header */}
              <div className="border-b border-slate-200 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">Mã hóa đơn</span>
                  <span className="font-bold text-slate-900">#{order.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Trạng thái</span>
                  {statusBadge(order.status)}
                </div>
              </div>

              {/* Gia sư */}
              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">👨‍🏫 Gia sư</h4>
                <div className="flex items-center gap-3">
                  {order.tutorAvatar ? (
                    <img src={order.tutorAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                      {order.tutorName?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.tutorName || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{order.tutorEmail}</p>
                  </div>
                </div>
              </div>

              {/* Học viên */}
              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">🎓 Học viên</h4>
                <div className="flex items-center gap-3">
                  {order.studentAvatar ? (
                    <img src={order.studentAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                      {order.studentName?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.studentName || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{order.studentEmail}</p>
                  </div>
                </div>
              </div>

              {/* Lớp học */}
              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">📚 Lớp học</h4>
                <p className="text-sm text-slate-900 font-semibold">{order.className}</p>
                {order.classDescription && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{order.classDescription}</p>
                )}
              </div>

              {/* Chi tiết thanh toán */}
              <div className="border-b border-slate-200 pb-4 space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">💳 Chi tiết thanh toán</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Số tiền</span>
                  <span className="font-bold text-blue-700 text-lg">{formatAmount(order.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Phương thức</span>
                  <span className="text-slate-900">
                    {order.paymentProvider === 'CASH' ? 'Tiền mặt' : order.paymentProvider || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Trạng thái thanh toán</span>
                  <span className="text-slate-900">{order.paymentStatus || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ngày tạo</span>
                  <span className="text-slate-900">{formatDate(order.dateCreate)}</span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Ngày thanh toán</span>
                    <span className="text-green-700 font-semibold">{formatDate(order.paidAt)}</span>
                  </div>
                )}
              </div>

              {/* Trạng thái đăng ký */}
              {order.enrollments.length > 0 && (
                <div className="border-b border-slate-200 pb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">📋 Trạng thái đăng ký</h4>
                  {order.enrollments.map((enr) => (
                    <div key={enr.id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-slate-500">Đơn #{enr.id}</span>
                      <div className="flex items-center gap-2">
                        {enrollmentStatusBadge(enr.status)}
                        {enr.approvedAt && (
                          <span className="text-xs text-slate-400">
                            Duyệt: {new Date(enr.approvedAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* VNPAY Info */}
              {order.vnpTransactionNo && (
                <div className="border-b border-slate-200 pb-4 space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700">🔐 Thông tin VNPAY</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Mã giao dịch</span>
                    <span className="text-slate-900 font-mono text-xs">{order.vnpTransactionNo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Mã tham chiếu</span>
                    <span className="text-slate-900 font-mono text-xs">{order.vnpTxnRef}</span>
                  </div>
                  {order.vnpResponseCode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Mã phản hồi</span>
                      <span className={`font-mono text-xs ${order.vnpResponseCode === '00' ? 'text-green-600' : 'text-red-600'}`}>
                        {order.vnpResponseCode === '00' ? 'Thành công' : order.vnpResponseCode}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full mt-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
