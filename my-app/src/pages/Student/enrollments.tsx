import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { AccountLayout } from '../../components/AccountLayout'
import { getMyEnrollments, requestCashPayment, type EnrollmentResponse } from '../../api/classApi'
import { OrderDetailModal } from '../../components/OrderDetailModal'
import { createRating, getMyRatings, updateRating, type RatingResponse } from '../../api/ratings'

export function StudentEnrollments() {
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  const [ratings, setRatings] = useState<RatingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [cashRequesting, setCashRequesting] = useState<number | null>(null)
  const [viewOrderId, setViewOrderId] = useState<number | null>(null)
  const [ratingTarget, setRatingTarget] = useState<EnrollmentResponse | null>(null)
  const [ratingStars, setRatingStars] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  const fetchData = () => {
    Promise.all([getMyEnrollments(0, 50), getMyRatings()])
      .then(([enrollmentData, ratingData]) => {
        setEnrollments(enrollmentData.content)
        setRatings(ratingData)
      })
      .catch(() => toast.error('Không thể tải danh sách đăng ký'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      void getMyEnrollments(0, 50)
        .then((data) => {
          setEnrollments((prev) => JSON.stringify(data.content) !== JSON.stringify(prev) ? data.content : prev)
        })
        .catch(() => {})
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleRequestCashPayment = async (enrollmentId: number) => {
    setCashRequesting(enrollmentId)
    try {
      await requestCashPayment(enrollmentId)
      toast.success('Đã yêu cầu thanh toán tiền mặt. Vui lòng chờ gia sư xác nhận.')
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setCashRequesting(null)
    }
  }

  const getRatingForEnrollment = (enrollment: EnrollmentResponse) =>
    ratings.find((rating) => rating.enrollmentId === enrollment.id || rating.classId === enrollment.classId)

  const canRateClass = (enrollment: EnrollmentResponse) =>
    enrollment.status === 'PAID' && enrollment.classStatus === 'COMPLETED'

  const openRatingModal = (enrollment: EnrollmentResponse) => {
    const existingRating = getRatingForEnrollment(enrollment)
    setRatingTarget(enrollment)
    setRatingStars(existingRating?.stars ?? 5)
    setRatingComment(existingRating?.comment ?? '')
  }

  const closeRatingModal = () => {
    setRatingTarget(null)
    setRatingStars(5)
    setRatingComment('')
  }

  const handleSubmitRating = async () => {
    if (!ratingTarget) return

    const existingRating = getRatingForEnrollment(ratingTarget)
    setRatingSubmitting(true)
    try {
      if (existingRating) {
        await updateRating(existingRating.id, {
          stars: ratingStars,
          comment: ratingComment.trim(),
        })
        toast.success('Đã cập nhật đánh giá lớp học')
      } else {
        await createRating({
          classId: ratingTarget.classId,
          enrollmentId: ratingTarget.id,
          stars: ratingStars,
          comment: ratingComment.trim(),
        })
        toast.success('Cảm ơn bạn đã đánh giá lớp học')
      }

      setRatings(await getMyRatings())
      closeRatingModal()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data || 'Không thể gửi đánh giá')
    } finally {
      setRatingSubmitting(false)
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
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <AccountLayout activePath="/student/enrollments">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Thanh toán</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái đăng ký, thanh toán và đánh giá lớp học.</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">Đang tải...</div>
        ) : enrollments.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Bạn chưa đăng ký lớp học nào</p>
            <a
              href="/discover/classes"
              className="mt-3 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Tìm lớp học
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => {
              const existingRating = getRatingForEnrollment(enrollment)
              return (
                <div key={enrollment.id} className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{enrollment.classTitle}</h3>
                      <div className="mt-2 flex items-center gap-3">
                        {statusBadge(enrollment.status)}
                        <span className="text-xs text-slate-400">
                          Đăng ký: {new Date(enrollment.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {enrollment.status === 'APPROVED' && (
                        <div className="mt-3">
                          <p className="mb-2 text-xs text-blue-600">Gia sư đã duyệt, bạn có thể thanh toán.</p>
                          <button
                            onClick={() => handleRequestCashPayment(enrollment.id)}
                            disabled={cashRequesting !== null}
                            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                          >
                            {cashRequesting === enrollment.id ? '...' : 'Tôi đã thanh toán tiền mặt'}
                          </button>
                        </div>
                      )}

                      {enrollment.status === 'CASH_REQUESTED' && (
                        <p className="mt-2 text-xs text-purple-600">Đã gửi yêu cầu, chờ gia sư xác nhận.</p>
                      )}

                      {enrollment.status === 'PAID' && (
                        <div className="mt-3">
                          {enrollment.paidAt ? (
                            <p className="mb-2 text-xs text-green-600">
                              Đã thanh toán ngày {new Date(enrollment.paidAt).toLocaleDateString('vi-VN')}
                            </p>
                          ) : null}
                          {existingRating ? (
                            <p className="mb-2 text-xs font-semibold text-amber-600">
                              Đã đánh giá {existingRating.stars}/5 sao
                            </p>
                          ) : null}
                          {!existingRating && !canRateClass(enrollment) ? (
                            <p className="mb-2 text-xs font-semibold text-slate-500">
                              Bạn có thể đánh giá sau khi gia sư đánh dấu lớp học đã hoàn thành.
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setViewOrderId(enrollment.orderId || enrollment.id)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              Xem hóa đơn
                            </button>
                            <button
                              onClick={() => (existingRating || canRateClass(enrollment)) && openRatingModal(enrollment)}
                              disabled={!existingRating && !canRateClass(enrollment)}
                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {existingRating ? 'Cập nhật đánh giá' : 'Đánh giá lớp học'}
                            </button>
                          </div>
                        </div>
                      )}

                      {enrollment.status === 'PENDING' && (
                        <p className="mt-2 text-xs text-yellow-600">Đang chờ gia sư xác nhận.</p>
                      )}

                      {enrollment.status === 'REJECTED' && enrollment.note && (
                        <p className="mt-2 text-xs text-red-600">Lý do: {enrollment.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {viewOrderId && (
        <OrderDetailModal
          isOpen={true}
          orderId={viewOrderId}
          onClose={() => setViewOrderId(null)}
        />
      )}

      {ratingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Đánh giá lớp học</h2>
                <p className="mt-1 text-sm text-slate-500">{ratingTarget.classTitle}</p>
              </div>
              <button
                type="button"
                onClick={closeRatingModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-800">Mức độ hài lòng</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border text-2xl transition ${
                      star <= ratingStars
                        ? 'border-amber-300 bg-amber-50 text-amber-500'
                        : 'border-slate-200 bg-white text-slate-300 hover:border-amber-200'
                    }`}
                    aria-label={`${star} sao`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Nhận xét</span>
              <textarea
                value={ratingComment}
                onChange={(event) => setRatingComment(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Chia sẻ trải nghiệm học tập của bạn..."
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRatingModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitRating}
                disabled={ratingSubmitting}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ratingSubmitting ? 'Đang lưu...' : getRatingForEnrollment(ratingTarget) ? 'Cập nhật' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  )
}
