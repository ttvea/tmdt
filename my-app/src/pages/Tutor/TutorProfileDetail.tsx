import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import Navbar from '../../layouts/Navbar'
import Footer from '../../layouts/Footer'
import { getTutorProfile, type TutorProfileResponse } from '../../api/tutorProfile'
import { getMediaUrl } from '../../api/axios'
import { getTutorRatings, getAverageRating, createRating, updateRating, deleteRating, type RatingResponse } from '../../api/ratings'
import { createOrGetConversation } from '../../api/conversations'
import { getMyEnrollments, getTutorClasses, type ClassResponse } from '../../api/classApi'
import { ConsultationModal } from '../../components/ConsultationModal'
import { getTutorVouchers, claimVoucher, type VoucherResponse } from '../../api/voucher'
import { getTutorRevenue, type TutorRevenueResponse } from '../../api/order'

interface TutorProfile {
  id: number
  name: string
  avatar: string
  fullName: string
  subjects: string[]
  location: string
  experience: number
  rating: number
  totalReviews: number
  lessons: number
  students: number
  satisfaction: number
  bio: string
  education: string
  teachingMethods: string[]
  price: number
  schedule: Record<string, Record<string, boolean>>
  reviews: Review[]
  verified: boolean
  hoursPerLesson: number
  certificateUrl: string
}

interface Review {
  id: number
  studentId: number
  author: string
  avatar: string
  content: string
  rating: number
  date: string
}

const DAY_KEYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const PERIODS = [
  { key: 'morning', label: 'Sáng', start: 6 * 60, end: 12 * 60 },
  { key: 'afternoon', label: 'Chiều', start: 12 * 60, end: 18 * 60 },
  { key: 'evening', label: 'Tối', start: 18 * 60, end: 24 * 60 },
]

const createEmptySchedule = (): Record<string, Record<string, boolean>> =>
  DAY_KEYS.reduce((result, day) => {
    result[day] = PERIODS.reduce<Record<string, boolean>>((periods, period) => {
      periods[period.key] = false
      return periods
    }, {})
    return result
  }, {} as Record<string, Record<string, boolean>>)

const ScheduleGrid = ({ schedule }: { schedule: Record<string, Record<string, boolean>> }) => {
  return (
    <div className="grid grid-cols-7 gap-2">
      {DAY_KEYS.map((day) => (
        <div key={day} className="p-2 text-center font-semibold text-slate-700">
          {day}
        </div>
      ))}
      
      {PERIODS.map((period) =>
        DAY_KEYS.map((day) => {
          const isBusy = schedule[day]?.[period.key] ?? false
          return (
            <div
              key={`${day}-${period.key}`}
              className={`rounded border p-2 text-center text-sm font-semibold ${
                isBusy
                  ? 'border-slate-200 bg-slate-100 text-slate-400 line-through'
                  : 'border-green-200 bg-green-100 text-green-700'
              }`}
            >
              {isBusy ? '-' : period.label}
            </div>
          )
        })
      )}
    </div>
  )
}
interface StarRatingProps {
  rating: number
  reviewCount?: number
}

const StarRating = ({ rating, reviewCount }: StarRatingProps) => {
  const fullStars = Math.floor(rating)

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={i < fullStars ? 'text-yellow-400' : 'text-slate-300'}
        >
          ★
        </span>
      ))}
      {reviewCount && (
        <span className="text-sm text-slate-600 ms-2">
          {rating.toFixed(1)} ({reviewCount} đánh giá)
        </span>
      )}
    </div>
  )
}

const getInitialAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`

const mapRatingToReview = (rating: RatingResponse): Review => ({
  id: rating.id,
  studentId: rating.studentId,
  author: rating.nameStudent || `Học viên #${rating.studentId}`,
  avatar: rating.avatar || getInitialAvatar(rating.nameStudent || `HV ${rating.studentId}`),
  content: rating.comment ?? '',
  rating: rating.stars,
  date: new Date(rating.createdAt).toLocaleDateString('vi-VN'),
})

const TUTOR_CLASS_PAGE_SIZE = 100

async function getAllTutorClassesForProfile(tutorId: number) {
  const firstPage = await getTutorClasses(tutorId, 0, TUTOR_CLASS_PAGE_SIZE)
  if (firstPage.totalPages <= 1) return firstPage.content

  const restPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      getTutorClasses(tutorId, index + 1, TUTOR_CLASS_PAGE_SIZE)
    )
  )

  return [firstPage, ...restPages].flatMap((pageData) => pageData.content)
}

export function TutorProfileDetail() {
  const tutorId = window.location.pathname.split('/')[2]
  const [profile, setProfile] = useState<TutorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [newStars, setNewStars] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [existingRatingId, setExistingRatingId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRatingId, setEditingRatingId] = useState<number | null>(null)
  const [editingStars, setEditingStars] = useState(5)
  const [editingComment, setEditingComment] = useState('')
  const [savingRating, setSavingRating] = useState(false)
  const [canRateTutor, setCanRateTutor] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [tutorVouchers, setTutorVouchers] = useState<VoucherResponse[]>([])
  const [loadingVouchers, setLoadingVouchers] = useState(false)
  const [claimedVoucherIds, setClaimedVoucherIds] = useState<Set<number>>(new Set())
  const [claimingVoucherId, setClaimingVoucherId] = useState<number | null>(null)
  // Revenue state
  const [loadingRevenue, setLoadingRevenue] = useState(false)
  const [revenueData, setRevenueData] = useState<TutorRevenueResponse | null>(null)
  const [revenueFromDate, setRevenueFromDate] = useState('')
  const [revenueToDate, setRevenueToDate] = useState('')

  const handleNavigateBack = () => {
    window.history.back()
  }

  const handleOpenConsultation = async () => {
    try {
      const id = await createOrGetConversation({ tutorId: Number(tutorId) })
      setConversationId(id)
      setIsModalOpen(true)
    } catch (err) {
      console.error('Không thể mở cuộc hội thoại', err)
      toast.error('Không thể mở cuộc hội thoại, vui lòng thử lại.')
    }
  }

  const refreshRatings = async (userId?: number | null) => {
    const ratings = await getTutorRatings(Number(tutorId))
    const avg = await getAverageRating(Number(tutorId))

    console.log('[Rating Debug] tutorId:', tutorId)
    console.log('[Rating Debug] ratings response:', ratings)
    console.log('[Rating Debug] average rating:', avg)

    const resolvedUserId = userId ?? currentUserId
    const existing = resolvedUserId
      ? ratings.find((rating) => rating.studentId === resolvedUserId)
      : null

    console.log('[Rating Debug] currentUserId:', resolvedUserId)
    console.log('[Rating Debug] matched existing rating:', existing)

    setExistingRatingId(existing?.id ?? null)
    if (existing) {
      setNewStars(existing.stars)
      setNewComment(existing.comment ?? '')
    }

    setProfile((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        rating: Number(avg) || 0,
        totalReviews: Array.isArray(ratings) ? ratings.length : 0,
        reviews: (ratings ?? []).map(mapRatingToReview),
      }
    })

    return ratings
  }

  const buildScheduleFromClasses = (classes: ClassResponse[]): Record<string, Record<string, boolean>> => {
    const daysMap: Record<number, string> = {
      2: 'T2',
      3: 'T3',
      4: 'T4',
      5: 'T5',
      6: 'T6',
      7: 'T7',
      8: 'CN',
    }

    const schedule = createEmptySchedule()
    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number)
      return hours * 60 + minutes
    }

    classes.forEach((cls) => {
      cls.schedules?.forEach((slot) => {
        const dayKey = daysMap[slot.dayOfWeek]
        if (!dayKey) return

        const start = toMinutes(slot.startTime)
        const rawEnd = toMinutes(slot.endTime)
        const end = rawEnd === 0 && start > 0 ? 24 * 60 : rawEnd

        PERIODS.forEach((period) => {
          const isOverlapping = start < period.end && end > period.start
          if (isOverlapping) {
            schedule[dayKey][period.key] = true
          }
        })
      })
    })

    return schedule
  }
  useEffect(() => {
    const userData = localStorage.getItem('user')
    let detectedUserId: number | null = null
    if (userData) {
      try {
        const user = JSON.parse(userData)
        const parsedUserId = Number(user.id)
        detectedUserId = Number.isFinite(parsedUserId) ? parsedUserId : null
        setCurrentUserId(detectedUserId)
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }

    const fetchProfile = async () => {
      try {
        if (!tutorId || isNaN(Number(tutorId))) {
          setError('ID gia sư không hợp lệ')
          setLoading(false)
          return
        }

        const apiResponse: TutorProfileResponse = await getTutorProfile(Number(tutorId))
        
        const mappedProfile: TutorProfile = {
          id: apiResponse.userId,
          name: apiResponse.fullName,
          avatar: apiResponse.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(apiResponse.avatar)}&background=random`,
          fullName: apiResponse.fullName,
          subjects: apiResponse.subjects.map(s => s.name),
          location: 'Chưa cập nhật', 
          experience: parseInt(apiResponse.experience.split(' ')[0]) || 0,
          rating: 0, 
          totalReviews: 0,
          lessons: 0,
          students: 0, 
          satisfaction: 0, 
          bio: apiResponse.bio || '',
          education: `${apiResponse.major}${apiResponse.university ? ' - ' + apiResponse.university : ''}`,
          teachingMethods: ['Đánh giá đầu vào', 'Lộ trình cá nhân', 'Báo cáo tiến độ'],
          price: 0, 
          hoursPerLesson: 90,
          schedule: createEmptySchedule(),
          reviews: [],
          verified: apiResponse.isVerified,
          certificateUrl: apiResponse.certificateUrl || '',
        }
        
        try {
          const tutorClasses = await getAllTutorClassesForProfile(apiResponse.userId)
          const teachingClasses = tutorClasses.filter(
            (cls) => cls.approvalStatus === 'APPROVED' && cls.status === 'CLOSED'
          )
          const completedClasses = tutorClasses.filter(
            (cls) => cls.approvalStatus === 'APPROVED' && cls.status === 'COMPLETED'
          )

          mappedProfile.schedule = buildScheduleFromClasses(teachingClasses)
          mappedProfile.lessons = completedClasses.reduce(
            (total, cls) => total + (Number(cls.totalSessions) || 0),
            0
          )
          mappedProfile.students = completedClasses.reduce(
            (total, cls) => total + (Number(cls.currentStudents) || 0),
            0
          )
        } catch (scheduleError) {
          console.error('Không thể tải thời khóa biểu:', scheduleError)
        }

        setProfile(mappedProfile)
        if (detectedUserId) {
          try {
            const enrollments = await getMyEnrollments(0, 100)
            const hasPaidEnrollment = enrollments.content.some(
              (enrollment) => enrollment.tutorId === apiResponse.userId && enrollment.status === 'PAID'
            )
            setCanRateTutor(hasPaidEnrollment)
          } catch (enrollmentErr) {
            console.error('Không thể kiểm tra điều kiện đánh giá:', enrollmentErr)
            setCanRateTutor(false)
          }
        } else {
          setCanRateTutor(false)
        }

        // fetch ratings and average
        try {
          const ratings = await getTutorRatings(Number(tutorId))

          // detect if current user already rated
          const existing = ratings?.find((r) => r.studentId === detectedUserId)
          if (existing) {
            setExistingRatingId(existing.id)
            // prefill values so user can update later if we add update feature
            setNewStars(existing.stars)
            setNewComment(existing.comment ?? '')
          } else {
            setExistingRatingId(null)
          }

          await refreshRatings(detectedUserId)
        } catch (ratingErr) {
          console.error('Không thể tải đánh giá:', ratingErr)
        }
        // Fetch active vouchers for this tutor
        setLoadingVouchers(true)
        try {
          const vouchers = await getTutorVouchers(Number(tutorId))
          setTutorVouchers(vouchers)
        } catch (err) {
          console.error('Không thể tải voucher:', err)
        } finally {
          setLoadingVouchers(false)
        }

        setLoading(false)
      } catch (err) {
        setError('Không thể tải thông tin gia sư')
        setLoading(false)
      }
    }

    fetchProfile()
  }, [tutorId])

  const handleSubmitRating = async () => {
    if (!tutorId) return
    setSubmittingRating(true)
    try {
      console.log('[Rating Debug] submitting rating:', {
        tutorId: Number(tutorId),
        existingRatingId,
        newStars,
        newComment,
      })

      if (existingRatingId) {
        await updateRating(existingRatingId, { stars: newStars, comment: newComment })
      } else {
        await createRating({ tutorId: Number(tutorId), stars: newStars, comment: newComment })
      }
      await refreshRatings(currentUserId)
      setNewComment('')
      setNewStars(5)
    } catch (err) {
      console.error('Lỗi gửi đánh giá', err)
      toast.error('Không thể gửi đánh giá: ' + String(err))
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleDeleteRating = async () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDeleteRating = async () => {
    setShowDeleteConfirm(false)

    try {
      await deleteRating(existingRatingId || 0)
      setExistingRatingId(null)
      setNewStars(5)
      setNewComment('')
      await refreshRatings()
    } catch (err) {
      console.error('Không thể xóa đánh giá', err)
      toast.error('Không thể xóa đánh giá, vui lòng thử lại.')
    }
  }

  const handleOpenEditModal = (review: Review) => {
    setEditingRatingId(review.id)
    setEditingStars(review.rating)
    setEditingComment(review.content)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingRatingId(null)
    setEditingStars(5)
    setEditingComment('')
  }

  const handleClaimVoucher = async (voucherId: number) => {
    setClaimingVoucherId(voucherId)
    try {
      await claimVoucher(voucherId)
      setClaimedVoucherIds((prev) => new Set(prev).add(voucherId))
      toast.success('Nhận voucher thành công! Voucher đã được thêm vào tài khoản của bạn.')
    } catch (err: any) {
      toast.error(err.response?.data || 'Không thể nhận voucher')
    } finally {
      setClaimingVoucherId(null)
    }
  }

  const handleFetchRevenue = async () => {
    setLoadingRevenue(true)
    try {
      const data = await getTutorRevenue(
        Number(tutorId),
        revenueFromDate || undefined,
        revenueToDate || undefined
      )
      setRevenueData(data)
    } catch (err) {
      toast.error('Không thể tải doanh thu')
      console.error('Revenue fetch error:', err)
    } finally {
      setLoadingRevenue(false)
    }
  }

  const handleSaveEditRating = async () => {
    if (!editingRatingId) return
    setSavingRating(true)
    try {
      await updateRating(editingRatingId, {
        stars: editingStars,
        comment: editingComment,
      })
      console.log('[Rating Debug] updated rating:', { editingRatingId, editingStars, editingComment })
      await refreshRatings(currentUserId)
      handleCloseEditModal()
    } catch (err) {
      console.error('Không thể cập nhật đánh giá', err)
      toast.error('Không thể cập nhật đánh giá, vui lòng thử lại.')
    } finally {
      setSavingRating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-xl font-semibold">Đang tải...</div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold text-red-600">{error}</div>
          <button
            onClick={handleNavigateBack}
            className="inline-block px-4 py-2 text-blue-600 hover:underline"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    )
  }

  const certificateUrl = profile.certificateUrl
    ? getMediaUrl(profile.certificateUrl) ?? profile.certificateUrl
    : ''
  const isCertificateImage = /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(certificateUrl)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Xác nhận xóa đánh giá</h3>
            <p className="mt-2 text-sm text-slate-600">Bạn muốn xóa đánh giá này?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRating}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-slate-900 text-white text-center py-16">
        <div className="container mx-auto px-4">
          <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-3">
            Hồ sơ gia sư
          </span>
          <h1 className="text-4xl font-bold mb-3 !text-white" style={{ color: '#ffffff' }}>{profile.fullName}</h1>
          <p className="text-slate-300 mx-auto max-w-2xl">
            {profile.subjects.join(' • ')} • {profile.experience} năm kinh nghiệm • {profile.location}
          </p>
        </div>
      </section>

      <section className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={handleNavigateBack}
            className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            ← Quay lại danh sách
          </button>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <div className="flex flex-wrap gap-6 items-start mb-6">
                  <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center text-4xl">
                    <img src={profile.avatar} alt={profile.fullName} className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold">{profile.fullName}</h1>
                      {profile.verified && (
                        <span className="inline-block bg-purple-200 text-purple-700 px-3 py-1 rounded text-sm font-medium">
                          ✓ Đã xác thực
                        </span>
                      )}
                    </div>
                    <div className="mb-3">
                      <StarRating rating={profile.rating} reviewCount={profile.totalReviews} />
                    </div>
                    <p className="text-slate-600 mb-4">{profile.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded text-sm border border-slate-200"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">{profile.lessons}</div>
                    <div className="text-sm text-slate-600">Buổi đã dạy</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">{profile.students}</div>
                    <div className="text-sm text-slate-600">Học viên</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">{profile.experience} năm</div>
                    <div className="text-sm text-slate-600">Kinh nghiệm</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">{profile.satisfaction}%</div>
                    <div className="text-sm text-slate-600">Hài lòng</div>
                  </div>
                </div>
              </div>

              <div className="mb-8 bg-white p-6 rounded-lg border border-slate-200">
                <h2 className="text-2xl font-bold mb-6">Thông tin nổi bật</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex gap-4">
                    <div className="text-2xl">🎓</div>
                    <div>
                      <div className="text-sm text-slate-600">Học vấn</div>
                      <div className="font-semibold">{profile.education}</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-2xl">💼</div>
                    <div>
                      <div className="text-sm text-slate-600">Kinh nghiệm</div>
                      <div className="font-semibold">{profile.experience} năm dạy Toán & Lý THCS, THPT</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-2xl">📍</div>
                    <div>
                      <div className="text-sm text-slate-600">Khu vực</div>
                      <div className="font-semibold">{profile.location}</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-2xl">🎥</div>
                    <div>
                      <div className="text-sm text-slate-600">Hình thức</div>
                      <div className="font-semibold">Tại nhà hoặc online</div>
                    </div>
                  </div>
                </div>
              </div>

              

              <div className="mb-8 bg-white p-6 rounded-lg border border-slate-200">
                <h2 className="text-2xl font-bold mb-6">Thời gian rãnh trong tuần</h2>
                <ScheduleGrid schedule={profile.schedule} />
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Đánh giá từ học viên</h2>
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded font-semibold">
                    {profile.rating}/5
                  </span>
                </div>

                <div className="space-y-4">
                  {profile.reviews.map((review) => (
                    <div key={review.id} className="pb-4 border-b border-slate-200 last:border-b-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.avatar}
                            alt={review.author}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-semibold text-slate-900">{review.author}</div>
                            <div className="text-xs text-slate-500">{review.date}</div>
                          </div>
                        </div>
                        {review.studentId === currentUserId && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(review)}
                              className="rounded p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                              aria-label="Sửa đánh giá"
                              title="Sửa đánh giá"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRating()}
                              className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              aria-label="Xóa đánh giá"
                              title="Xóa đánh giá"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mb-2">
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-slate-700 mb-3">{review.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="mb-6 bg-white p-6 rounded-lg border border-slate-200">
               
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold mb-2 hover:bg-blue-700">
                  Mời dạy
                </button>
                <button 
                  onClick={handleOpenConsultation}
                  className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold border border-blue-600 mb-3 hover:bg-blue-50">
                  Nhắn tin tư vấn
                </button>
                <hr className="my-3" />
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Đánh giá gia sư</h4>
                  {canRateTutor || existingRatingId ? (
                    <>
                      <div className="mb-2 flex items-center gap-2">
                        {[1,2,3,4,5].map((s) => (
                          <button
                            key={s}
                            onClick={() => setNewStars(s)}
                            className={`text-2xl ${s <= newStars ? 'text-yellow-400' : 'text-slate-300'}`}
                            aria-label={`Chọn ${s} sao`}
                            type="button"
                          >
                            ★
                          </button>
                        ))}
                        <span className="text-sm text-slate-600">{newStars} sao</span>
                      </div>

                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Viết nhận xét của bạn..."
                        className="w-full border border-slate-200 rounded p-2 mb-2 text-sm"
                        rows={3}
                      />

                      <button
                        onClick={handleSubmitRating}
                        disabled={submittingRating}
                        className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-60"
                      >
                        {existingRatingId ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                      </button>
                    </>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                      Bạn chỉ có thể đánh giá gia sư sau khi đã học và thanh toán ít nhất một lớp của gia sư này.
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="mb-4 font-bold text-slate-950">Chứng chỉ gia sư</h3>
                {profile.certificateUrl ? (
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M14 2v6h6M8 13h8M8 17h5"
                      />
                    </svg>
                    Xem chứng chỉ
                  </button>
                ) : (
                  <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                    Gia sư chưa cập nhật chứng chỉ.
                  </div>
                )}
              </div>

              <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="mb-4 font-bold text-slate-950">Mã giảm giá của gia sư</h3>
                {loadingVouchers ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                ) : tutorVouchers.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                    Gia sư chưa có mã giảm giá nào.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tutorVouchers.map((v) => {
                      const isClaimed = claimedVoucherIds.has(v.id)
                      const isClaiming = claimingVoucherId === v.id
                      return (
                        <div
                          key={v.id}
                          className={`rounded-lg border p-3 ${
                            isClaimed
                              ? 'border-slate-200 bg-slate-50'
                              : 'border-green-200 bg-green-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold text-sm tracking-wide ${
                              isClaimed ? 'text-slate-400' : 'text-green-700'
                            }`}>
                              {v.code}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              isClaimed
                                ? 'bg-slate-200 text-slate-500'
                                : 'bg-green-200 text-green-800'
                            }`}>
                              {v.discountType === 'PERCENT'
                                ? `${v.discountValue}%`
                                : `${v.discountValue.toLocaleString('vi-VN')}₫`}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 space-y-0.5 mb-2">
                            {v.minPrice && (
                              <div>Đơn tối thiểu: <strong>{v.minPrice.toLocaleString('vi-VN')}₫</strong></div>
                            )}
                            {v.endDate && (
                              <div>HSD: {new Date(v.endDate).toLocaleDateString('vi-VN')}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleClaimVoucher(v.id)}
                            disabled={isClaimed || isClaiming}
                            className={`w-full text-xs font-semibold py-1.5 rounded transition ${
                              isClaimed
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60'
                            }`}
                          >
                            {isClaiming
                              ? 'Đang nhận...'
                              : isClaimed
                                ? 'Đã nhận'
                                : 'Nhận voucher'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="mb-4 font-bold text-slate-950">Thống kê doanh thu</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Từ ngày</label>
                    <input
                      type="date"
                      value={revenueFromDate}
                      onChange={(e) => setRevenueFromDate(e.target.value)}
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Đến ngày</label>
                    <input
                      type="date"
                      value={revenueToDate}
                      onChange={(e) => setRevenueToDate(e.target.value)}
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleFetchRevenue}
                    disabled={loadingRevenue}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loadingRevenue ? 'Đang tải...' : 'Xem doanh thu'}
                  </button>

                  {revenueData && (
                    <div className="mt-3 space-y-2 rounded-lg bg-green-50 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Tổng số đơn</span>
                        <span className="font-bold text-slate-900">{revenueData.totalOrders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Tổng doanh thu</span>
                        <span className="font-bold text-green-700">
                          {revenueData.totalAmount.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Phí nền tảng</span>
                        <span className="font-bold text-red-600">
                          -{revenueData.totalPlatformFee.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                      <div className="border-t border-green-200 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">Thực nhận</span>
                          <span className="font-bold text-blue-700">
                            {revenueData.totalTutorEarning.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="font-bold mb-4">Hồ sơ đã xác minh</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div>✓ CCCD và thông tin liên hệ</div>
                  <div>✓ Bằng cấp sư phạm</div>
                  <div>✓ Kinh nghiệm giảng dạy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <ConsultationModal
        isOpen={isModalOpen}
        tutorName={profile.fullName}
        tutorAvatar={profile.avatar}
        conversationId={conversationId}
        onClose={() => setIsModalOpen(false)}
      />

      {showCertificateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
          onClick={() => setShowCertificateModal(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Chứng chỉ gia sư</h3>
                <p className="text-sm text-slate-500">{profile.fullName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Đóng xem chứng chỉ"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="min-h-[60vh] overflow-auto bg-slate-100 p-4">
              {isCertificateImage ? (
                <img
                  src={certificateUrl}
                  alt={`Chứng chỉ của ${profile.fullName}`}
                  className="mx-auto max-h-[72vh] max-w-full rounded-lg bg-white object-contain shadow-sm"
                />
              ) : (
                <iframe
                  src={certificateUrl}
                  title={`Chứng chỉ của ${profile.fullName}`}
                  className="h-[72vh] w-full rounded-lg border border-slate-200 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Rating Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-slate-900">Cập nhật đánh giá</h3>
            
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-900">Điểm sao</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setEditingStars(s)}
                    className={`text-3xl transition ${
                      s <= editingStars ? 'text-yellow-400' : 'text-slate-300'
                    }`}
                    type="button"
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-600">{editingStars} sao</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-900">Nhận xét</label>
              <textarea
                value={editingComment}
                onChange={(e) => setEditingComment(e.target.value)}
                placeholder="Viết nhận xét của bạn..."
                className="w-full rounded border border-slate-200 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCloseEditModal}
                className="flex-1 rounded bg-slate-200 py-2 font-semibold text-slate-900 hover:bg-slate-300"
                type="button"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditRating}
                disabled={savingRating}
                className="flex-1 rounded bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                type="button"
              >
                {savingRating ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
