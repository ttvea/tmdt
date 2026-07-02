import { useEffect, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { AccountPageContainer } from '../../components/AccountPageContainer'
import { AccountPageHeader } from '../../components/AccountPageHeader'
import { getStudentRefunds, type RefundResponse, REFUND_STATUS_LABELS, REFUND_REASON_LABELS } from '../../api/refund'

export function StudentRefunds() {
  const [refunds, setRefunds] = useState<RefundResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRefunds()
  }, [])

  async function loadRefunds() {
    setLoading(true)
    try {
      const data = await getStudentRefunds()
      setRefunds(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
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
    <AccountLayout activePath="/student/refunds">
      <AccountPageContainer>
        <AccountPageHeader title="Hoàn tiền" />

        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải...</div>
        ) : refunds.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="text-4xl mb-3">🔄</div>
            <p className="text-slate-600">Bạn chưa có yêu cầu hoàn tiền nào</p>
            <a
              href="/student/enrollments"
              className="inline-block mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Xem thanh toán
            </a>
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
                        <span className="text-slate-500">Số tiền hoàn:</span>
                        <span className="ml-2 font-bold text-green-700">{formatCurrency(refund.amount)}</span>
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
                    {refund.status === 'COMPLETED' && refund.completedAt && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700 font-semibold">
                          ✅ Đã hoàn tiền ngày {formatDate(refund.completedAt)}
                        </p>
                      </div>
                    )}
                    {refund.status === 'PENDING_REFUND' && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-700">
                          ⏳ Đang chờ gia sư thanh toán tiền hoàn
                        </p>
                      </div>
                    )}
                    {refund.status === 'TUTOR_PAID' && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          💳 Gia sư đã thanh toán, chờ admin xác nhận hoàn tiền
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AccountPageContainer>
    </AccountLayout>
  )
}
