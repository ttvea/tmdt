import { useEffect, useState, type ReactNode } from 'react'
import {
  getAdminDashboard,
  getCurrentAdmin,
  getAdminReportPreview,
  type AdminReportChartPoint,
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
  totalGrossRevenue: 0,
  platformRevenue: 0,
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

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return formatNumber(value)
}

function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function buildStatCards(stats: AdminDashboardStats): StatCard[] {
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

function buildOverviewStatCards(stats: AdminDashboardStats): StatCard[] {
  const grossRevenue = stats.totalGrossRevenue ?? 0
  const platformRevenue = stats.platformRevenue ?? stats.totalRevenue ?? 0

  return [
    {
      label: 'Tổng học phí',
      value: formatCurrency(grossRevenue),
      detail: 'Tổng tiền học viên đã thanh toán',
      tone: 'blue',
    },
    {
      label: 'Hoa hồng nền tảng',
      value: formatCurrency(platformRevenue),
      detail: 'Phí 10% nền tảng giữ lại',
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
  const [revenueChart, setRevenueChart] = useState<AdminReportChartPoint[]>([])
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    const today = new Date()
    const from = new Date(today)
    from.setDate(today.getDate() - 29)

    Promise.all([
      getCurrentAdmin(token),
      getAdminDashboard(token).catch(() => emptyDashboardStats),
      getAdminReportPreview({
        type: 'DASHBOARD',
        from: toDateInput(from),
        to: toDateInput(today),
      }).catch(() => ({ metrics: [], chart: [], rows: [] })),
    ])
      .then(([adminData, dashboardData, reportPreview]) => {
        setAdmin(adminData)
        setDashboard(dashboardData)
        setRevenueChart(reportPreview.chart || [])
        localStorage.setItem('user', JSON.stringify(adminData))
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      })
      .finally(() => setIsChecking(false))
  }, [])

  const statCards = buildOverviewStatCards(dashboard)

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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <StatCard key={card.label} card={card} />
        ))}
      </section>

      <section className="mt-5 grid grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)] gap-5">
        <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <RevenueTrendChart data={revenueChart} />
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

function RevenueTrendChart({ data }: { data: AdminReportChartPoint[] }) {
  const chartData = data.length > 0 ? data : [{ label: '-', value: 0 }]
  const maxValue = Math.max(...chartData.map((item) => item.value), 1)
  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  const average = chartData.length > 0 ? total / chartData.length : 0
  const highest = Math.max(...chartData.map((item) => item.value), 0)
  const hasData = chartData.some((item) => item.value > 0)
  const width = 680
  const height = 260
  const left = 44
  const right = 28
  const top = 28
  const bottom = 42
  const innerWidth = width - left - right
  const innerHeight = height - top - bottom
  const points = chartData.map((item, index) => {
    const x = left + (index * innerWidth) / Math.max(chartData.length - 1, 1)
    const y = top + innerHeight - (item.value / maxValue) * innerHeight
    return { ...item, x, y }
  })
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPoints = `${left},${top + innerHeight} ${linePoints} ${left + innerWidth},${top + innerHeight}`

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-950">Xu hướng doanh thu nền tảng</h2>
          <p className="mt-1 text-sm text-slate-500">Dữ liệu phí nền tảng từ các đơn hàng đã thanh toán trong 30 ngày gần nhất.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-700" />
          Hoa hồng nền tảng
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ChartSummary label="Tổng kỳ này" value={formatCurrency(total)} />
        <ChartSummary label="Cao nhất" value={formatCurrency(highest)} />
        <ChartSummary label="Trung bình" value={formatCurrency(Math.round(average))} />
      </div>

      <div className="relative mt-5 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-blue-50/70 to-white p-3">
        <svg className="h-[290px] w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ xu hướng doanh thu nền tảng">
          <defs>
            <linearGradient id="dashboardRevenueArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = top + innerHeight - ratio * innerHeight
            return (
              <g key={ratio}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="#dbe3ef" strokeDasharray={ratio === 0 ? '0' : '5 6'} />
                <text x={left - 8} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-semibold">
                  {formatCompactCurrency(Math.round(maxValue * ratio))}
                </text>
              </g>
            )
          })}

          {points.map((point, index) => {
            const barWidth = Math.max(8, innerWidth / Math.max(points.length, 1) - 10)
            const barHeight = (point.value / maxValue) * innerHeight
            return (
              <rect
                key={`bar-${point.label}-${index}`}
                x={point.x - barWidth / 2}
                y={top + innerHeight - barHeight}
                width={barWidth}
                height={barHeight}
                rx="5"
                fill="#93c5fd"
                opacity="0.45"
              />
            )
          })}

          <polygon points={areaPoints} fill="url(#dashboardRevenueArea)" />
          <polyline points={linePoints} fill="none" stroke="#075ec8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((point, index) => (
            <g key={`point-${point.label}-${index}`}>
              <circle cx={point.x} cy={point.y} r="5.5" fill="#fff" stroke="#075ec8" strokeWidth="3" />
              {point.value > 0 && (
                <text x={point.x} y={Math.max(point.y - 12, 14)} textAnchor="middle" className="fill-blue-800 text-[10px] font-bold">
                  {formatCompactCurrency(point.value)}
                </text>
              )}
            </g>
          ))}

          {points.map((point, index) => {
            if (index !== 0 && index !== points.length - 1 && index % 2 !== 0) return null
            return (
              <text key={`label-${point.label}-${index}`} x={point.x} y={height - 10} textAnchor="middle" className="fill-slate-600 text-[10px] font-semibold">
                {point.label}
              </text>
            )
          })}
        </svg>

        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/65">
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-4 text-center shadow-sm">
              <p className="text-sm font-bold text-slate-700">Chưa có doanh thu trong khoảng thời gian này</p>
              <p className="mt-1 text-xs text-slate-500">Biểu đồ sẽ tự cập nhật khi có đơn hàng thanh toán thành công.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChartSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
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
