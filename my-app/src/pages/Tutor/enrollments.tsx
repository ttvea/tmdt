import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { AccountLayout } from '../../components/AccountLayout'
import { OrderDetailModal } from '../../components/OrderDetailModal'
import { getMyClasses, getEnrollmentsOfClass, reviewEnrollment, confirmCashReceived, type ClassResponse, type EnrollmentResponse } from '../../api/classApi'
// import { supabase } from '../../api/supabase'

export function TutorEnrollments() {
  const [classes, setClasses] = useState<ClassResponse[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [viewOrderId, setViewOrderId] = useState<number | null>(null)

  const fetchEnrollments = async (classId: number) => {
    const data = await getEnrollmentsOfClass(classId, 0, 50)
    setEnrollments(data.content)
    return data
  }

  useEffect(() => {
    getMyClasses(0, 100)
      .then((data) => {
        setClasses(data.content)
        if (data.content.length > 0) {
          setSelectedClassId(data.content[0].id)
        }
      })
      .catch(() => toast.error('Không thể tải danh sách lớp'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedClassId) return
    setEnrollmentsLoading(true)
    fetchEnrollments(selectedClassId)
      .catch(() => toast.error('Không thể tải danh sách đăng ký'))
      .finally(() => setEnrollmentsLoading(false))
  }, [selectedClassId])

  // Polling every 3 seconds for realtime updates
  useEffect(() => {
    if (!selectedClassId) return

    const interval = setInterval(() => {
      void fetchEnrollments(selectedClassId)
        .catch(() => {})
    }, 3000)

    return () => clearInterval(interval)
  }, [selectedClassId])

  const handleReview = async (enrollmentId: number, approved: boolean) => {
    setProcessingId(enrollmentId)
    try {
      await reviewEnrollment(enrollmentId, approved)
      toast.success(approved ? 'Đã chấp nhận đăng ký' : 'Đã từ chối đăng ký')
      if (selectedClassId) {
        const data = await getEnrollmentsOfClass(selectedClassId, 0, 50)
        setEnrollments(data.content)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setProcessingId(null)
    }
  }

  const handleConfirmCash = async (enrollmentId: number) => {
    setProcessingId(enrollmentId)
    try {
      await confirmCashReceived(enrollmentId)
      toast.success('Đã xác nhận nhận tiền mặt!')
      if (selectedClassId) {
        const data = await getEnrollmentsOfClass(selectedClassId, 0, 50)
        setEnrollments(data.content)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setProcessingId(null)
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
      CASH_REQUESTED: 'Yêu cầu tiền mặt',
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

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  return (
    <AccountLayout activePath="/tutor/enrollments">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">💳 Thanh toán</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý đơn đăng ký và thanh toán từ học viên</p>
        </div>

        {/* Select class */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn lớp học</label>
          {loading ? (
            <div className="text-sm text-slate-500">Đang tải lớp học...</div>
          ) : classes.length === 0 ? (
            <div className="text-sm text-slate-500">Bạn chưa có lớp học nào</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    selectedClassId === c.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Enrollments list */}
        {selectedClass && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-900">{selectedClass.title}</h2>
              <p className="text-xs text-slate-500">
                Sĩ số: {selectedClass.currentStudents}/{selectedClass.maxStudents} học viên
              </p>
            </div>

            {enrollmentsLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Đang tải...</div>
            ) : enrollments.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">Chưa có học viên đăng ký</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                          {enrollment.studentName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{enrollment.studentName || 'Học viên'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {statusBadge(enrollment.status)}
                            <span className="text-xs text-slate-400">
                              {new Date(enrollment.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {enrollment.status === 'PENDING' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleReview(enrollment.id, true)}
                            disabled={processingId !== null}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {processingId === enrollment.id ? '...' : '✓ Duyệt'}
                          </button>
                          <button
                            onClick={() => handleReview(enrollment.id, false)}
                            disabled={processingId !== null}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            ✗ Từ chối
                          </button>
                        </div>
                      )}

                      {enrollment.status === 'APPROVED' && (
                        <div className="text-sm text-blue-600 font-semibold">⏳ Chờ thanh toán</div>
                      )}

                      {enrollment.status === 'CASH_REQUESTED' && (
                        <button
                          onClick={() => handleConfirmCash(enrollment.id)}
                          disabled={processingId !== null}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {processingId === enrollment.id ? '...' : '✅ Xác nhận đã nhận tiền mặt'}
                        </button>
                      )}

                      {enrollment.status === 'PAID' && (
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-green-600 font-semibold">✅ Đã thanh toán</div>
                          <button
                            onClick={() => setViewOrderId(enrollment.orderId || enrollment.id)}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            📄 Xem hóa đơn
                          </button>
                        </div>
                      )}

                      {enrollment.status === 'REJECTED' && enrollment.note && (
                        <div className="text-sm text-red-600 font-semibold">
                          ✗ Từ chối: {enrollment.note}
                        </div>
                      )}

                      {enrollment.status === 'REJECTED' && !enrollment.note && (
                        <div className="text-sm text-red-600 font-semibold">✗ Đã từ chối</div>
                      )}

                      {enrollment.status === 'CANCELLED' && (
                        <div className="text-sm text-slate-500 font-semibold">Đã hủy</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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