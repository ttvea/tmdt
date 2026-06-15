import { useEffect, useState } from 'react'
import { getOrderDetail, type OrderResponse } from '../api/order'

interface OrderDetailModalProps {
  isOpen: boolean
  orderId: number
  onClose: () => void
}

export function OrderDetailModal({ isOpen, orderId, onClose }: OrderDetailModalProps) {
  const [order, setOrder] = useState<OrderResponse | null>(null)
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
        <div className="p-6">
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

              {/* Class Info */}
              <div className="border-b border-slate-200 pb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Thông tin lớp học</h4>
                <p className="text-sm text-slate-900">{order.className}</p>
              </div>

              {/* Payment Details */}
              <div className="border-b border-slate-200 pb-4 space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">Chi tiết thanh toán</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Số tiền</span>
                  <span className="font-bold text-blue-700 text-lg">{formatAmount(order.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ngày tạo</span>
                  <span className="text-slate-900">{formatDate(order.dateCreate)}</span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Ngày thanh toán</span>
                    <span className="text-green-700">{formatDate(order.paidAt)}</span>
                  </div>
                )}
              </div>

              {/* VNPAY Info */}
              {order.vnpTransactionNo && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700">Thông tin VNPAY</h4>
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

              {/* Close button */}
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