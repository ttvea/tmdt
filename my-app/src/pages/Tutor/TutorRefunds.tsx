import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { AccountLayout } from '../../components/AccountLayout'
import { getTutorRefunds, type RefundResponse, REFUND_STATUS_LABELS, REFUND_REASON_LABELS } from '../../api/refund'
import api from '../../api/axios'

export function TutorRefunds() {
  const [refunds, setRefunds] = useState<RefundResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<number | null>(null)

  useEffect(() => {
    loadRefunds()
  }, [])

  async function loadRefunds() {
    setLoading(true)
    try {
      const data = await getTutorRefunds()
      setRefunds(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function getAuthHeader() {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function handlePay(refundId: number) {
    setPayingId(refundId)
    try {
      const res = await api.post(`/api/tutor/refunds/${refundId}/pay`, null, {
        headers: getAuthHeader(),
      })
      const paymentUrl = res.data?.paymentUrl
      if (paymentUrl) {
        window.open(paymentUrl, '_blank')
        toast.success('Đã tạo link thanh toán VNPAY!')
      }
      loadRefunds()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tạo link thanh toán.')
    } finally {
      setPayingId(null)
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING_REFUND: 'bg-amber-100 text-amber-800',
      TUTOR_PAID: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
    }
    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
        {REFUND_STATUS_LABELS[status] || status}
      </span>
    )
  }

  const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`
  const formatDate = (date: string | null) => date ? new Date(date).toLocaleString('vi-VN') : '—'

  return (
    <AccountLayout activePath="/tutor/refunds">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">🔄 Hoàn tiền</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý các yêu cầu hoàn tiền cần thanh toán</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải...</div>
        ) : refunds.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="text-4xl mb-3">🔄</div>
            <p className="text-slate-600">Bạn chưa có yêu cầu hoàn tiền nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {refunds.map((refund) => (
              <div key={refund.id} className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-bold text-blue-700">#{refund.id}</span>
                      {statusBadge(refund.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Số tiền cần hoàn:</span>
                        <span className="ml-2 font-bold text-red-600">{formatCurrency(refund.amount)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Lý do:</span>
                        <span className="ml-2 text-slate-700">{REFUND_REASON_LABELS[refund.reason] || refund.reason}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Mã hóa đơn:</span>
                        <span className="ml-2 font-mono text-slate-700">#{refund.orderId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Ngày tạo:</span>
                        <span className="ml-2 text-slate-700">{formatDate(refund.createdAt)}</span>
                      </div>
                    </div>

                    {refund.status === 'PENDING_REFUND' && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-lg flex items-center justify-between">
                        <p className="text-sm text-amber-700">⚠️ Bạn cần thanh toán {formatCurrency(refund.amount)} để hoàn tiền cho học viên</p>
                        <button
                          onClick={() => handlePay(refund.id)}
                          disabled={payingId === refund.id}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {payingId === refund.id ? 'Đang tạo...' : '💳 Thanh toán qua VNPAY'}
                        </button>
                      </div>
                    )}

                    {refund.status === 'TUTOR_PAID' && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          ✅ Bạn đã thanh toán xong. Chờ admin xác nhận hoàn tiền cho học viên.
                        </p>
                        {refund.vnpTransactionNo && (
                          <p className="text-xs text-blue-500 mt-1">Mã GD: {refund.vnpTransactionNo}</p>
                        )}
                      </div>
                    )}

                    {refund.status === 'COMPLETED' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700 font-semibold">
                          ✅ Đã hoàn tiền xong ngày {formatDate(refund.completedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  )
}