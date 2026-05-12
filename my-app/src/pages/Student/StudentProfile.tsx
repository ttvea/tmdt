import { useEffect, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { getUserProfile, type UserProfileResponse } from '../../api/userProfile.ts'

const GENDER_LABELS: Record<string, string> = {
  male: 'Nam', female: 'Nữ', other: 'Khác',
}

export function StudentProfile() {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const userId: number = user?.id

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEmailTooltip, setShowEmailTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

useEffect(() => {
  if (!userId) { 
    setLoading(false); 
    return; 
  }

  getUserProfile(userId)
    .then((data: UserProfileResponse) => { 
      setProfile(data); 
      setLoading(false); 
    })
    .catch((error) => {
      console.error("Lỗi khi lấy thông tin học viên:", error);
      setLoading(false);
    });
}, [userId]);

  const displayName = profile?.fullName || user?.fullName || user?.username || user?.name || 'Học viên'
  const avatarUrl = profile?.avatar || user?.avatar || null

  return (
    <AccountLayout activePath="/student/profile">
      <div className="min-h-screen bg-slate-50 text-left">

        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="max-w-4xl mx-auto flex items-center gap-8">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-slate-300 absolute inset-0 m-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
              <span className="absolute bottom-1.5 left-1.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {loading ? <span className="inline-block w-36 h-7 bg-slate-200 rounded animate-pulse" /> : displayName}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Học viên</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8 flex gap-8 items-start">
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
          ) : (
            <>
              <div className="flex-1 min-w-0 flex flex-col gap-6">
                <section className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="text-base font-bold text-slate-900 mb-4">Thông tin tài khoản</h2>
                  <div className="flex flex-col gap-0">
                    {[
                      { label: 'Họ và tên', value: profile?.fullName || '—' },
                      { label: 'Giới tính', value: GENDER_LABELS[profile?.gender ?? ''] || '—' },
                      { label: 'Năm sinh', value: profile?.birthday ? String(profile.birthday) : '—' },
                      { label: 'Số điện thoại', value: profile?.phone || '—' },
                    ].map((item, idx, arr) => (
                      <div key={item.label}
                        className={`flex items-center gap-3 py-3 ${idx < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <span className="text-sm text-slate-400 w-36 shrink-0">{item.label}</span>
                        <span className="text-sm font-semibold text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="w-60 shrink-0">
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Liên hệ</p>
                  {[
                    { label: 'Email', value: profile?.email || user?.email || '—' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-slate-400 shrink-0">{item.label}:</span>
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
