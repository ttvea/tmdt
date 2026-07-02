import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { AccountLayout } from '../../components/AccountLayout'
import { getMyEnrollments, requestCashPayment, type EnrollmentResponse } from '../../api/classApi'
import { OrderDetailModal } from '../../components/OrderDetailModal'
// import { supabase } from '../../api/supabase'

export function StudentEnrollments() {
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [cashRequesting, setCashRequesting] = useState<number | null>(null)
  const [viewOrderId, setViewOrderId] = useState<number | null>(null)

  const fetchData = () => {
    getMyEnrollments(0, 50)
      .then((data) => setEnrollments(data.content))
      .catch(() => toast.error('Không thể tải danh sách đăng ký'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Polling every 3 seconds for realtime updates
  useEffect(() => {
    const interval = setInterval(() => {
      void getMyEnrollments(0, 50)
        .then((data) => {
          setEnrollments((prev) => {
            if (JSON.stringify(data.content) !== JSON.stringify(prev)) {
              return data.content
            }
            return prev
          })
        })
        .catch(() => {})
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleRequestCashPayment = async (enrollmentId: number) => {
    setCashRequesting(enrollmentId)
    try {
      await requestCashPayment(enrollmentId)
      toast.success('Đã yêu cầu thanh toán tiền mặt! Vui lòng chờ gia sư xác nhận.')
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setCashRequesting(null)
    }
  }

  const statusBadge = (status: string) => {
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
      CASH_REQUESTED: 'Chờ xác nhận tiền mặt',
      PAID: 'Đã thanh toán',
      REJECTED: 'Từ chối',
      CANCELLED: 'Đã hủy',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <AccountLayout activePath="/student/enrollments">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">💳 Thanh toán</h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi trạng thái đăng ký và thanh toán lớp học</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải...</div>
        ) : enrollments.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-600">Bạn chưa đăng ký lớp học nào</p>
            <a
              href="/discover/classes"
              className="inline-block mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Tìm lớp học
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white rounded-lg border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{enrollment.classTitle}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      {statusBadge(enrollment.status)}
                      <span className="text-xs text-slate-400">
                        Đăng ký: {new Date(enrollment.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    {enrollment.status === 'APPROVED' && (
                      <div className="mt-3">
                        <p className="text-xs text-blue-600 mb-2">
                          ⏳ Gia sư đã duyệt, bạn có thể thanh toán
                        </p>
                        <button
                          onClick={() => handleRequestCashPayment(enrollment.id)}
                          disabled={cashRequesting !== null}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {cashRequesting === enrollment.id ? '...' : '💰 Tôi đã thanh toán tiền mặt'}
                        </button>
                      </div>
                    )}
                    {enrollment.status === 'CASH_REQUESTED' && (
                      <p className="text-xs text-purple-600 mt-2">
                        ⏳ Đã gửi yêu cầu, chờ gia sư xác nhận
                      </p>
                    )}
                    {enrollment.status === 'PAID' && enrollment.paidAt && (
                      <div className="mt-2">
                        <p className="text-xs text-green-600 mb-2">
                          ✅ Đã thanh toán ngày {new Date(enrollment.paidAt).toLocaleDateString('vi-VN')}
                        </p>
                        <button
                          onClick={() => setViewOrderId(enrollment.orderId || enrollment.id)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                        >
                          📄 Xem hóa đơn
                        </button>
                      </div>
                    )}
                    {enrollment.status === 'PENDING' && (
                      <p className="text-xs text-yellow-600 mt-2">
                        ⏳ Đang chờ gia sư xác nhận
                      </p>
                    )}
                    {enrollment.status === 'REJECTED' && enrollment.note && (
                      <p className="text-xs text-red-600 mt-2">
                        Lý do: {enrollment.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {viewOrderId && (
        <OrderDetailModal
          isOpen={true}
          orderId={viewOrderId}
          onClose={() => setViewOrderId(null)}
        />
      )}
    </AccountLayout>
  )
}