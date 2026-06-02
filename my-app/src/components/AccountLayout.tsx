import { type ReactNode, useEffect, useState } from 'react'
import Navbar from '../layouts/Navbar'
import { getTutorProfile, type TutorProfileResponse } from '../api/tutorProfile'
import { getMediaUrl } from '../api/axios'
import { isTutorRole } from '../utils/userRole'

interface MenuItem {
  label: string
  href: string
  icon: ReactNode
}

const tutorMenuItems: MenuItem[] = [
  {
    label: 'Trang cá nhân',
    href: '/tutor/profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Lớp học của tôi',
    href: '/tutor/classes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 3L2 8l10 5 10-5-10-5zM2 16l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: 'Thời khóa biểu',
    href: '/tutor/schedule',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 7V3m8 4V3M4 11h16M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      </svg>
    ),
  },
  {
    label: 'Tin nhắn',
    href: '/tutor/messages',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Mã giảm giá',
    href: '/tutor/vouchers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.25a2.75 2.75 0 0 0 0 5.5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.25a2.75 2.75 0 0 0 0-5.5V7zM9 9h.01M15 15h.01M15 9l-6 6" />
      </svg>
    ),
  },
  {
    label: 'Hỗ trợ',
    href: '/tutor/support',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4v-5zm13 0h3v5h-3v-5zm-4 5h2a5 5 0 0 0 5-5" />
      </svg>
    ),
  },
  {
    label: 'Cài đặt',
    href: '/tutor/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
      </svg>
    ),
  },
]

const studentMenuItems: MenuItem[] = [
  {
    label: 'Trang cá nhân',
    href: '/student/profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Lớp học của tôi',
    href: '/student/classes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 3L2 8l10 5 10-5-10-5zM2 16l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: 'Thời khóa biểu',
    href: '/student/schedule',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 7V3m8 4V3M4 11h16M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      </svg>
    ),
  },
  {
    label: 'Tin nhắn',
    href: '/student/messages',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Hỗ trợ',
    href: '/student/support',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4v-5zm13 0h3v5h-3v-5zm-4 5h2a5 5 0 0 0 5-5" />
      </svg>
    ),
  },
  {
    label: 'Cài đặt',
    href: '/student/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
      </svg>
    ),
  },
]

interface AccountLayoutProps {
  children: ReactNode
  activePath?: string
}

export function AccountLayout({ children, activePath }: AccountLayoutProps) {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const userId: number = user?.id
  const isTutor = isTutorRole(user?.role)

  const [profile, setProfile] = useState<TutorProfileResponse | null>(null)

  useEffect(() => {
    if (!userId) return
    getTutorProfile(userId)
      .then(setProfile)
      .catch(() => {})
  }, [userId])

  const displayName = profile?.fullName || user?.fullName || user?.username || user?.name || 'Người dùng'
  const avatarUrl = getMediaUrl(profile?.avatar || user?.avatar)
  const roleLabel = isTutor ? 'Gia sư' : 'Học viên'
  const menuItems = isTutor ? tutorMenuItems : studentMenuItems

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-left">
      <Navbar />
      <div className="flex flex-1">
        <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
            <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0 text-white font-bold text-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{roleLabel}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
            {menuItems.map((item) => {
              const isActive = activePath === item.href
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className={isActive ? 'text-blue-700' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              )
            })}
          </nav>

          <div className="px-3 py-4 border-t border-slate-100">
            <button
              onClick={() => {
                localStorage.removeItem('access_token')
                localStorage.removeItem('user')
                window.location.href = '/'
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
