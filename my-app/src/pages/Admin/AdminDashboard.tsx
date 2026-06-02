import { useEffect, useState, type ReactNode } from 'react'
import {
  getAdminDashboard,
  getCurrentAdmin,
  type AdminDashboardStats,
  type AdminSession,
} from '../../api/admin'
import { AdminLayout } from '../../components/AdminLayout'

type StatCard = {
  label: string
  value: string
  detail: string
  tone: 'blue' | 'slate' | 'yellow'
  trend?: string
  trendTone?: 'up' | 'down'
  urgent?: boolean
}

const emptyDashboardStats: AdminDashboardStats = {
  totalRevenue: 0,
  totalUsers: 0,
  newUsersThisWeek: 0,
  totalTutors: 0,
  verifiedTutors: 0,
  pendingClasses: 0,
  totalClasses: 0,
  openClasses: 0,
  teachingClasses: 0,
  completedClasses: 0,
  totalEnrollments: 0,
  pendingEnrollments: 0,
  paidEnrollments: 0,
}

const emptyBars = [0, 0, 0, 0, 0, 0, 0]

function formatNumber(value: number) {
  return value.toLocaleString('vi-VN')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function buildStatCards(stats: AdminDashboardStats): StatCard[] {
  return [
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      detail: 'Doanh thu từ đơn hàng đã thanh toán',
      tone: 'blue',
    },
    {
      label: 'Người dùng mới',
      value: formatNumber(stats.newUsersThisWeek),
      detail: `${formatNumber(stats.totalUsers)} người dùng trong hệ thống`,
      tone: 'slate',
    },
    {
      label: 'Gia sư đang hoạt động',
      value: formatNumber(stats.totalTutors),
      detail: `${formatNumber(stats.verifiedTutors)} hồ sơ gia sư đã xác minh`,
      tone: 'slate',
    },
    {
      label: 'Chờ phê duyệt',
      value: formatNumber(stats.pendingClasses),
      detail: `${formatNumber(stats.pendingEnrollments)} lượt đăng ký lớp đang chờ`,
      tone: 'yellow',
      urgent: stats.pendingClasses > 0 || stats.pendingEnrollments > 0,
    },
  ]
}

export function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [dashboard, setDashboard] = useState<AdminDashboardStats>(emptyDashboardStats)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    Promise.all([getCurrentAdmin(token), getAdminDashboard(token).catch(() => emptyDashboardStats)])
      .then(([adminData, dashboardData]) => {
        setAdmin(adminData)
        setDashboard(dashboardData)
        localStorage.setItem('user', JSON.stringify(adminData))
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      })
      .finally(() => setIsChecking(false))
  }, [])

  const statCards = buildStatCards(dashboard)

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-sm font-semibold text-slate-600">
        Đang kiểm tra quyền quản trị...
      </div>
    )
  }

  return (
    <AdminLayout activePath="/admin" adminName={admin?.fullName}>
      <div className="mb-5 flex items-start justify-between gap-5">
        <div>
          <div role="heading" aria-level={1} className="text-2xl font-bold text-blue-900">Tổng quan Hệ thống</div>
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
              {emptyBars.map((height, index) => (
                <div key={index} className="flex h-full w-11 items-end justify-center">
                  <div className="w-5 rounded-t bg-blue-700" style={{ height: `${height * 100}%` }} />
                  <div className="ml-1 w-5 rounded-t bg-slate-300" style={{ height: `${Math.max(height - 0.16, 0) * 100}%` }} />
                </div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-500">
                Chưa có dữ liệu biểu đồ
              </div>
            </div>
            <div className="grid grid-cols-7 px-3 pt-3 text-center text-xs font-medium text-slate-700">
              {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 border-t border-slate-300 pt-5">
            <Metric label="Tổng lớp học" value={formatNumber(dashboard.totalClasses)} />
            <Metric label="Lớp đang tuyển" value={formatNumber(dashboard.openClasses)} />
            <Metric label="Lượt ghi danh đã thanh toán" value={formatNumber(dashboard.paidEnrollments)} />
          </div>
        </div>

        <aside className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="m-0 text-xl font-semibold text-slate-950">Hoạt động Gần đây</h2>
            <a href="/admin" className="text-xs font-bold text-blue-700 hover:underline">Xem tất cả</a>
          </div>
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            Chưa có dữ liệu hoạt động gần đây.
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
          <ProgressRow label="Chưa có dữ liệu" value="0%" width="0%" />
          <ProgressRow label="Chưa có dữ liệu" value="0%" width="0%" />
        </div>
        <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <h3 className="mb-5 text-xs font-bold uppercase tracking-wide text-slate-800">Tỷ lệ giữ chân người dùng</h3>
          <div className="flex h-20 items-end gap-3">
            {[0, 0, 0, 0].map((height, index) => (
              <div key={index} className={`flex-1 rounded-t ${index === 3 ? 'bg-blue-700' : 'bg-blue-100'}`} style={{ height: `${height * 100}%` }} />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-600">4 tuần qua</span>
            <span className="font-bold text-slate-500">0%</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-300 bg-white p-6 text-center shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-slate-900 [&_svg]:h-6 [&_svg]:w-6">
            <SparklesIcon />
          </div>
          <h3 className="text-base font-bold text-slate-950">Công cụ Khớp nối AI</h3>
          <p className="mt-2 max-w-[260px] text-xs leading-5 text-slate-600">
            Chưa có dữ liệu hiệu suất từ công cụ khớp nối tự động.
          </p>
          <a href="/admin" className="mt-4 text-xs font-bold text-blue-700 hover:underline">Tối ưu hóa Cài đặt</a>
        </div>
      </section>
    </AdminLayout>
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


function IconSvg({ children, className = 'h-6 w-6' }: { children: ReactNode; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">{children}</svg>
}

function UsersIcon() { return <IconSvg><><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></></IconSvg> }
function CalendarIcon() { return <IconSvg className="h-4 w-4"><><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></></IconSvg> }
function DownloadIcon() { return <IconSvg className="h-4 w-4"><><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></></IconSvg> }
function RevenueIcon() { return <IconSvg><><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 9h2M16 15h2" /></></IconSvg> }
function PendingIcon() { return <IconSvg><><path d="M7 7h10v12H7z" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /><circle cx="17" cy="17" r="4" /><path d="M17 15v2l1.5 1" /></></IconSvg> }
function SparklesIcon() { return <IconSvg className="h-8 w-8"><><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></></IconSvg> }
