import { useEffect, useState } from 'react'
import Navbar from '../../layouts/Navbar'
import Footer from '../../layouts/Footer'
import { getTutorProfile, type TutorProfileResponse } from '../../api/tutorProfile'
import { createOrGetConversation } from '../../api/conversations'
import { getTutorClasses, type ClassResponse } from '../../api/classApi'
import { ConsultationModal } from '../../components/ConsultationModal'

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
}

interface Review {
  id: number
  author: string
  role: string
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

export function TutorProfileDetail() {
  const tutorId = window.location.pathname.split('/')[2]
  const [profile, setProfile] = useState<TutorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)

  const handleNavigateBack = () => {
    window.history.back()
  }

  const handleOpenConsultation = async () => {
    try {
      const id = await createOrGetConversation(Number(tutorId))
      setConversationId(id)
      setIsModalOpen(true)
    } catch (err) {
      console.error('Không thể mở cuộc hội thoại', err)
      alert('Không thể mở cuộc hội thoại, vui lòng thử lại.')
    }
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
        }
        
        try {
          const classesResponse = await getTutorClasses(Number(tutorId))
          const teachingClasses = classesResponse.content.filter(
            (cls) => cls.approvalStatus === 'APPROVED' && cls.status === 'CLOSED'
          )
          mappedProfile.schedule = buildScheduleFromClasses(teachingClasses)
        } catch (scheduleError) {
          console.error('Không thể tải thời khóa biểu:', scheduleError)
        }

        setProfile(mappedProfile)
        setLoading(false)
      } catch (err) {
        setError('Không thể tải thông tin gia sư')
        setLoading(false)
      }
    }

    fetchProfile()
  }, [tutorId])

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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

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
                      <div className="mb-2">
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-slate-700 mb-3">{review.content}</p>
                      <div className="font-semibold">{review.author}</div>
                      <div className="text-sm text-slate-600">{review.role} • {review.date}</div>
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
    </div>
  )
}
