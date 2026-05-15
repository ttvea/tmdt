import { useEffect, useState, type ReactNode } from 'react'
import { getCurrentAdmin, logoutAdmin, type AdminSession } from '../../api/admin'

type StatCard = {
  label: string
  value: string
  detail: string
  tone: 'blue' | 'slate' | 'yellow'
  trend?: string
  trendTone?: 'up' | 'down'
  urgent?: boolean
}

type NavItem = {
  label: string
  icon: ReactNode
  active?: boolean
}

const navItems: NavItem[] = [
  { label: 'Tổng quan', active: true, icon: <DashboardIcon /> },
  { label: 'Người dùng', icon: <UsersIcon /> },
  { label: 'Gia sư', icon: <TutorIcon /> },
  { label: 'Mã giảm giá', icon: <TicketIcon /> },
  { label: 'Phê duyệt', icon: <ApprovalIcon /> },
  { label: 'Hỗ trợ', icon: <SupportIcon /> },
  { label: 'Tranh chấp', icon: <DisputeIcon /> },
]

const statCards: StatCard[] = [
  {
    label: 'Tổng doanh thu',
    value: '$482,904.00',
    detail: '+$14,200 so với tháng trước',
    tone: 'blue',
    trend: '12.5%',
    trendTone: 'up',
  },
  {
    label: 'Người dùng mới',
    value: '2,845',
    detail: '+122 người dùng tuần này',
    tone: 'slate',
    trend: '8.1%',
    trendTone: 'up',
  },
  {
    label: 'Gia sư đang hoạt động',
    value: '1,120',
    detail: '-12 từ lần kiểm tra trước',
    tone: 'slate',
    trend: '2.4%',
    trendTone: 'down',
  },
  {
    label: 'Chờ phê duyệt',
    value: '42',
    detail: 'Yêu cầu xem xét ngay lập tức',
    tone: 'yellow',
    urgent: true,
  },
]

const activities = [
  {
    title: 'Sarah Jenkins',
    text: 'đã đăng ký làm Gia sư mới',
    meta: 'Toán học • 2 phút trước',
    avatar: 'SJ',
    marker: 'blue',
  },
  {
    title: 'Phiên học được Duyệt:',
    text: 'Vật lý 101',
    meta: 'ID: #88291 • 15 phút trước',
    marker: 'check',
  },
  {
    title: 'David Chen',
    text: 'đã gửi một tranh chấp',
    meta: 'Vấn đề Thanh toán • 1 giờ trước',
    avatar: 'DC',
    marker: 'warning',
  },
  {
    title: '12 Người dùng mới',
    text: 'đã tham gia nền tảng',
    meta: 'Toàn cầu • 3 giờ trước',
    marker: 'count',
  },
]

const bars = [0.46, 0.62, 0.54, 0.78, 0.66, 0.86, 0.58]

export function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    getCurrentAdmin(token)
      .then((data) => {
        setAdmin(data)
        localStorage.setItem('user', JSON.stringify(data))
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      })
      .finally(() => setIsChecking(false))
  }, [])

  const handleLogout = async () => {
    const token = localStorage.getItem('access_token')
    try {
      await logoutAdmin(token)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-sm font-semibold text-slate-600">
        Đang kiểm tra quyền quản trị...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 flex w-[232px] flex-col border-r border-slate-300 bg-white">
          <div className="px-5 pb-6 pt-6">
            <a href="/admin" className="block text-xl font-bold tracking-tight text-blue-700">
              EduMatch Pro
            </a>
            <p className="mt-1 text-sm font-medium text-slate-500">Bảng điều khiển Admin</p>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`flex h-11 items-center gap-3 border-l-4 px-5 text-left text-sm font-medium transition ${
                  item.active
                    ? 'border-blue-700 bg-blue-100 text-slate-950'
                    : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-blue-700'
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center text-slate-900 [&_svg]:h-5 [&_svg]:w-5">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="px-4 pb-5">
            <div className="mb-4 border-t border-slate-300 pt-4">
              <button className="flex h-10 w-full items-center justify-center rounded bg-blue-700 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800">
                Tạo báo cáo
              </button>
            </div>

            <div className="space-y-1">
              <button className="flex h-9 w-full items-center gap-3 rounded px-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 [&_svg]:h-5 [&_svg]:w-5">
                <SettingsIcon /> Cài đặt
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-9 w-full items-center gap-3 rounded px-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 [&_svg]:h-5 [&_svg]:w-5"
              >
                <LogoutIcon /> Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        <div className="ml-[232px] flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-300 bg-white px-6">
            <div className="relative w-full max-w-[390px]">
              <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                placeholder="Tìm kiếm dữ liệu hoặc người dùng..."
                className="h-10 w-full rounded-lg border-0 bg-slate-100 pl-11 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex items-center gap-4">
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100 [&_svg]:h-5 [&_svg]:w-5" aria-label="Thông báo">
                <BellIcon />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100 [&_svg]:h-5 [&_svg]:w-5" aria-label="Trợ giúp">
                <HelpIcon />
              </button>
              <div className="h-8 w-px bg-slate-300" />
              <div className="text-right">
                <p className="text-xs font-bold text-slate-950">{admin?.fullName ?? 'Admin User'}</p>
                <p className="text-xs text-slate-500">Quản trị viên cao cấp</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-blue-100 text-xs font-bold text-blue-900">
                {getInitials(admin?.fullName)}
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6">
            <div className="mb-5 flex items-start justify-between gap-5">
              <div>
                <h1 className="m-0 text-3xl font-bold tracking-normal text-slate-950">Tổng quan Hệ thống</h1>
                <p className="mt-1 text-sm text-slate-700">Theo dõi thời gian thực các chỉ số sức khỏe và hiệu suất giáo dục.</p>
              </div>

              <div className="flex gap-2">
                <button className="inline-flex h-9 items-center gap-2 rounded border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50">
                  <CalendarIcon /> 30 ngày qua
                </button>
                <button className="inline-flex h-9 items-center gap-2 rounded bg-blue-700 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-800">
                  <DownloadIcon /> Xuất CSV
                </button>
              </div>
            </div>

            <section className="grid grid-cols-4 gap-4">
              {statCards.map((card) => (
                <StatCard key={card.label} card={card} />
              ))}
            </section>

            <section className="mt-5 grid grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)] gap-5">
              <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="m-0 text-xl font-semibold text-slate-950">Xu hướng Hành vi Người dùng</h2>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                    <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-700" /> Học sinh Hoạt động</span>
                    <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-500" /> Phiên học Gia sư</span>
                  </div>
                </div>

                <div className="flex h-[250px] flex-col justify-end">
                  <div className="relative flex h-[175px] items-end justify-between border-b border-slate-300 px-3">
                    <div className="absolute inset-x-0 bottom-20 border-t border-slate-200" />
                    {bars.map((height, index) => (
                      <div key={index} className="flex h-full w-11 items-end justify-center">
                        <div
                          className="w-5 rounded-t bg-blue-700"
                          style={{ height: `${height * 100}%` }}
                        />
                        <div
                          className="ml-1 w-5 rounded-t bg-slate-300"
                          style={{ height: `${(height - 0.16) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 px-3 pt-3 text-center text-xs font-medium text-slate-700">
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 border-t border-slate-300 pt-5">
                  <Metric label="TG Phiên học Trung bình" value="42p 12s" />
                  <Metric label="Tỷ lệ Thoát" value="24.5%" />
                  <Metric label="Tỷ lệ Chuyển đổi" value="18.2%" />
                </div>
              </div>

              <aside className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="m-0 text-xl font-semibold text-slate-950">Hoạt động Gần đây</h2>
                  <a href="/admin" className="text-xs font-bold text-blue-700 hover:underline">Xem tất cả</a>
                </div>

                <div className="space-y-4">
                  {activities.map((activity) => (
                    <ActivityItem key={`${activity.title}-${activity.meta}`} activity={activity} />
                  ))}
                </div>

                <div className="mt-6 rounded border border-slate-300 bg-slate-100 p-4">
                  <p className="text-sm font-bold text-slate-900">Tình trạng Hệ thống</p>
                  <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-green-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    Tất cả hệ thống hoạt động tốt
                  </p>
                </div>
              </aside>
            </section>

            <section className="mt-5 grid grid-cols-3 gap-5">
              <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-xs font-bold uppercase tracking-wide text-slate-800">Môn học hàng đầu</h3>
                <ProgressRow label="Toán học" value="42%" width="42%" />
                <ProgressRow label="Khoa học Dữ liệu" value="28%" width="28%" />
              </div>

              <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-xs font-bold uppercase tracking-wide text-slate-800">Tỷ lệ giữ chân người dùng</h3>
                <div className="flex h-20 items-end gap-3">
                  {[0.72, 0.66, 0.7, 0.78].map((height, index) => (
                    <div key={index} className={`flex-1 rounded-t ${index === 3 ? 'bg-blue-700' : 'bg-blue-100'}`} style={{ height: `${height * 100}%` }} />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600">4 tuần qua</span>
                  <span className="font-bold text-green-700">+2.1%</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-300 bg-white p-6 text-center shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-slate-900 [&_svg]:h-6 [&_svg]:w-6">
                  <SparklesIcon />
                </div>
                <h3 className="text-base font-bold text-slate-950">Công cụ Khớp nối AI</h3>
                <p className="mt-2 max-w-[260px] text-xs leading-5 text-slate-600">
                  Hiệu suất tăng 14% trong tháng này nhờ mô hình mới.
                </p>
                <a href="/admin" className="mt-4 text-xs font-bold text-blue-700 hover:underline">
                  Tối ưu hóa Cài đặt
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

function StatCard({ card }: { card: StatCard }) {
  const iconClass = {
    blue: 'bg-blue-700 text-white',
    slate: 'bg-blue-100 text-slate-800',
    yellow: 'bg-yellow-100 text-orange-700',
  }[card.tone]

  return (
    <article className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded [&_svg]:h-5 [&_svg]:w-5 ${iconClass}`}>
          {card.tone === 'blue' ? <RevenueIcon /> : card.tone === 'yellow' ? <PendingIcon /> : <UsersIcon />}
        </div>
        {card.trend ? (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${card.trendTone === 'down' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {card.trendTone === 'down' ? '↘' : '↗'} {card.trend}
          </span>
        ) : null}
        {card.urgent ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Khẩn cấp</span> : null}
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-800">{card.label}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-normal text-slate-950">{card.value}</p>
      <p className="mt-2 text-xs text-slate-600">{card.detail}</p>
    </article>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function ActivityItem({ activity }: { activity: (typeof activities)[number] }) {
  return (
    <div className="flex gap-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-900 [&_svg]:h-5 [&_svg]:w-5">
        {activity.avatar ?? (activity.marker === 'count' ? '+12' : <CheckIcon />)}
        <span className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ${
          activity.marker === 'warning' ? 'bg-amber-500' : activity.marker === 'check' ? 'bg-slate-400' : 'bg-blue-700'
        }`}>
          {activity.marker === 'warning' ? '!' : activity.marker === 'count' ? '' : '●'}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-sm leading-5 text-slate-950">
          <span className="font-bold">{activity.title}</span> {activity.text}
        </p>
        <p className="text-xs font-semibold text-slate-700">{activity.meta}</p>
      </div>
    </div>
  )
}

function ProgressRow({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-900">{label}</span>
        <span className="font-bold text-slate-950">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-700" style={{ width }} />
      </div>
    </div>
  )
}

function getInitials(name: string | undefined) {
  if (!name) return 'AU'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function IconSvg({ children, className = 'h-6 w-6' }: { children: ReactNode; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">{children}</svg>
}

function DashboardIcon() { return <IconSvg><><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></></IconSvg> }
function UsersIcon() { return <IconSvg><><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></></IconSvg> }
function TutorIcon() { return <IconSvg><><path d="m22 10-10-5-10 5 10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></></IconSvg> }
function TicketIcon() { return <IconSvg><><path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" /><path d="M9 9h.01M15 15h.01M16 8l-8 8" /></></IconSvg> }
function ApprovalIcon() { return <IconSvg><><path d="M16 11V7a4 4 0 1 0-8 0v4" /><path d="m5 14 4 4L19 8" /></></IconSvg> }
function SupportIcon() { return <IconSvg><><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H4zM17 14h3v5h-3z" /><path d="M13 19h2a5 5 0 0 0 5-5" /></></IconSvg> }
function DisputeIcon() { return <IconSvg><><path d="m4 19 5-5M14 4l6 6M5 5l14 14" /><path d="m12 6 6 6" /></></IconSvg> }
function SettingsIcon() { return <IconSvg><><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.03 3.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.4.25.74.6 1 1h.6a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" /></></IconSvg> }
function LogoutIcon() { return <IconSvg><><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></></IconSvg> }
function SearchIcon({ className }: { className?: string }) { return <IconSvg className={className}><><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></></IconSvg> }
function BellIcon() { return <IconSvg><><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></></IconSvg> }
function HelpIcon() { return <IconSvg><><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 1 1 5.8 1c-.5 1-1.6 1.4-2.2 2.2-.4.5-.7 1-.7 1.8" /><path d="M12 17h.01" /></></IconSvg> }
function CalendarIcon() { return <IconSvg className="h-4 w-4"><><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></></IconSvg> }
function DownloadIcon() { return <IconSvg className="h-4 w-4"><><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></></IconSvg> }
function RevenueIcon() { return <IconSvg><><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 9h2M16 15h2" /></></IconSvg> }
function PendingIcon() { return <IconSvg><><path d="M7 7h10v12H7z" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /><circle cx="17" cy="17" r="4" /><path d="M17 15v2l1.5 1" /></></IconSvg> }
function CheckIcon() { return <IconSvg className="h-6 w-6"><><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></></IconSvg> }
function SparklesIcon() { return <IconSvg className="h-8 w-8"><><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></></IconSvg> }
