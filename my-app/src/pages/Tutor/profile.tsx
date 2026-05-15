import { useEffect, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { getTutorProfile, type TutorProfileResponse } from '../../api/tutorProfile'
import { getMediaUrl } from '../../api/axios'

const OCCUPATION_LABELS: Record<string, string> = {
  student: 'Sinh viên',
  teacher: 'Giáo viên',
  lecturer: 'Giảng viên',
  worker: 'Người đi làm',
}

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Nam', FEMALE: 'Nữ',
  male: 'Nam', female: 'Nữ',
}

const CATEGORY_COLORS: Record<string, string> = {
  'Phổ thông': 'bg-green-200 text-green-700 border-green-200',
  'Năng khiếu':   'bg-amber-100 text-amber-700 border-amber-200',
  'Ngoại ngữ':         'bg-sky-100 text-sky-700 border-sky-200',
}
const DEFAULT_SUBJECT_COLOR = 'bg-slate-100 text-slate-700 border-slate-200'
export function TutorProfile() {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const userId: number = user?.id

  const [profile, setProfile] = useState<TutorProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEmailTooltip, setShowEmailTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!userId) {
      setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
      setLoading(false)
      return
    }
    getTutorProfile(userId)
      .then((data) => {
        setProfile(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Không thể tải thông tin profile.')
        setLoading(false)
      })
  }, [userId])

  const subjects = profile?.subjects ?? []

  const schoolInfo = profile?.occupationType === 'student'
    ? [profile.university, profile.studentYear ? `Năm ${profile.studentYear}` : ''].filter(Boolean).join(' · ')
    : [profile?.graduatedSchool, profile?.graduatedYear].filter(Boolean).join(' · ')

  const majorInfo = profile?.occupationType === 'student'
    ? profile?.major
    : profile?.teachMajor

  const displayName = profile?.fullName || user?.fullName || user?.username || user?.name || 'Chưa cập nhật tên'
  const avatarUrl = getMediaUrl(profile?.avatar || user?.avatar)

  return (
    <AccountLayout activePath="/tutor/profile">
      <div className="min-h-screen bg-slate-50 text-left">

        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="max-w-5xl mx-auto flex items-center gap-8">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-14 h-14 text-slate-300 absolute inset-0 m-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
              <span className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                  {loading ? (
                    <span className="inline-block w-40 h-7 bg-slate-200 rounded animate-pulse" />
                  ) : displayName}
                </h2>
                {profile?.isVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Đã xác thực
                  </span>
                )}
              </div>

              <p className="text-blue-600 font-semibold text-base leading-tight">
                {majorInfo || OCCUPATION_LABELS[profile?.occupationType ?? ''] || 'Gia sư'}
              </p>

              <div className="flex items-center gap-6 text-sm text-slate-500 flex-wrap mt-0.5">
                {profile?.experience && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M12 3L2 8l10 5 10-5-10-5zM2 16l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    {profile.experience} kinh nghiệm
                  </span>
                )}
                {schoolInfo && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {schoolInfo}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => window.location.href = '/tutor/info'}
                className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                Cập nhật thông tin
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-8 flex gap-8 items-start">

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm">Đang tải thông tin...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1">
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0 flex flex-col gap-8">

                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Giới thiệu bản thân</h2>
                  <div className="border border-slate-200 rounded-xl p-5 bg-white">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {profile?.bio || <span className="text-slate-400 italic">Chưa cập nhật giới thiệu bản thân.</span>}
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Kinh nghiệm & Chuyên môn</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Nghề nghiệp</p>
                      <p className="text-sm font-bold text-blue-600">
                        {OCCUPATION_LABELS[profile?.occupationType ?? ''] || '—'}
                      </p>
                      <p className="text-xs text-slate-500">{schoolInfo || '—'}</p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3L2 8l10 5 10-5-10-5zM2 16l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Kinh nghiệm giảng dạy</p>
                      <p className="text-sm font-bold text-blue-600">
                        {profile?.experience ?? '—'}
                      </p>
                      <p className="text-xs text-slate-500">{majorInfo || ''}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Môn học giảng dạy</h2>
                  {subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((s) => {
                        const colorClass = CATEGORY_COLORS[s.categoryName ?? ''] ?? DEFAULT_SUBJECT_COLOR
                        return (
                          <span
                            key={s.id}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border ${colorClass}`}
                          >
                            {s.name}
                            {s.categoryName && (
                              <span className="text-xs font-normal opacity-60">· {s.categoryName}</span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 bg-white text-center">
                      <p className="text-sm text-slate-400 italic">Chưa cập nhật môn dạy.</p>
                      <button
                        onClick={() => window.location.href = '/tutor/info'}
                        className="mt-3 text-xs text-blue-600 hover:underline font-medium"
                      >
                        Cập nhật ngay →
                      </button>
                    </div>
                  )}
                </section>

              </div>

              <div className="w-64 shrink-0 flex flex-col gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm font-bold text-blue-700">Xác thực</span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {[
                      'Chứng chỉ giảng dạy',
                      'Kiểm tra lý lịch đã đạt',
                      `Bằng cấp đã được xác minh: ${profile?.major || 'N/A'}`,
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-slate-700">
                        <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-0">
                  {[
                    { label: 'Giới tính', value: GENDER_LABELS[profile?.gender ?? ''] || '—' },
                    { label: 'Năm sinh', value: profile?.birthday ? String(profile.birthday) : '—' },
                    { label: 'Số điện thoại', value: profile?.phone || '—' },
                    { label: 'Email', value: profile?.email || '—' },
                  ].map((item, idx, arr) => (
                    <div
                      key={item.label}
                      className={`flex items-baseline gap-2 py-3 ${idx < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      <span className="text-xs font-medium text-slate-400 shrink-0">{item.label}:</span>
                      {item.label === 'Email' ? (
                        <span
                          className="relative truncate min-w-0"
                          onMouseEnter={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setTooltipPos({ x: rect.left, y: rect.top })
                            setShowEmailTooltip(true)
                          }}
                          onMouseLeave={() => setShowEmailTooltip(false)}
                        >
                          <span className="text-sm font-semibold text-slate-800 truncate block cursor-default">
                            {item.value}
                          </span>
                          {showEmailTooltip && (
                            <span
                              className="fixed z-[9999] bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg pointer-events-none"
                              style={{ left: tooltipPos.x, top: tooltipPos.y - 36 }}
                            >
                              {item.value}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-slate-800 truncate min-w-0">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AccountLayout>
  )
}
