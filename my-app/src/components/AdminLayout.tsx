import { type ReactNode, useState } from 'react'
import { exportAdminReport, type AdminReportType } from '../api/admin'

type NavItem = {
  label: string
  href: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: 'Tổng quan',   href: '/admin',         icon: <DashboardIcon /> },
  { label: 'Người dùng',  href: '/admin/users',    icon: <UsersIcon /> },
  { label: 'Gia sư',      href: '/admin/tutors',   icon: <TutorIcon /> },
  { label: 'Lớp học',     href: '/admin/classes',  icon: <ClassIcon /> },
  { label: 'Mã giảm giá', href: '/admin/coupons',  icon: <TicketIcon /> },
  { label: 'Thanh toán',  href: '/admin/payouts',  icon: <PayoutIcon /> },
  { label: 'Hỗ trợ',      href: '/admin/support',  icon: <SupportIcon /> },
  { label: 'Tranh chấp',  href: '/admin/disputes', icon: <DisputeIcon /> },
]

interface AdminLayoutProps {
  children: ReactNode
  activePath?: string
  adminName?: string
}

export function AdminLayout({ children, activePath, adminName }: AdminLayoutProps) {
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState<AdminReportType>('DASHBOARD')
  const [fromDate, setFromDate] = useState(() => getDefaultFromDate())
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [exporting, setExporting] = useState(false)
  const [reportError, setReportError] = useState('')

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const handleExportReport = async () => {
    setExporting(true)
    setReportError('')

    try {
      const blob = await exportAdminReport({
        type: reportType,
        from: fromDate || undefined,
        to: toDate || undefined,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `edumatch-${reportType.toLowerCase()}-${toDate || new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setShowReportModal(false)
    } catch {
      setReportError('Không thể tạo báo cáo. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
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
            {navItems.map((item) => {
              const isActive = activePath === item.href
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex h-11 items-center gap-3 border-l-4 px-5 text-left text-sm font-medium transition ${
                    isActive
                      ? 'border-blue-700 bg-blue-100 text-slate-950'
                      : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-blue-700'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center text-slate-900 [&_svg]:h-5 [&_svg]:w-5">
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              )
            })}
          </nav>

            <div className="px-4 pb-5">
              <div className="mb-4 border-t border-slate-300 pt-4">
              <a
                href="/admin/reports"
                className="flex h-10 w-full items-center justify-center rounded bg-blue-700 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800"
              >
                Tạo báo cáo
              </a>
            </div>
            <div className="space-y-1">
              <a
                href="/admin/settings"
                className={`flex h-9 w-full items-center gap-3 rounded px-3 text-left text-sm font-medium [&_svg]:h-5 [&_svg]:w-5 ${
                  activePath === '/admin/settings'
                    ? 'bg-blue-100 text-slate-950'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SettingsIcon /> Cài đặt
              </a>
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
              <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                placeholder="Tìm kiếm dữ liệu hoặc người dùng..."
                className="h-10 w-full rounded-lg border-0 bg-slate-100 pl-11 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-950">{adminName ?? 'Admin User'}</p>
                <p className="text-xs text-slate-500">Quản trị viên cao cấp</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-blue-100 text-xs font-bold text-blue-900">
                {getInitials(adminName)}
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6">
            {children}
          </main>
        </div>
      </div>

      {showReportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Tạo báo cáo</h2>
                <p className="mt-1 text-sm text-slate-500">Xuất báo cáo CSV cho dữ liệu quản trị.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Loại báo cáo</span>
                <select
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value as AdminReportType)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="DASHBOARD">Tổng quan hệ thống</option>
                  <option value="DISPUTES">Tranh chấp</option>
                  <option value="USERS">Người dùng</option>
                  <option value="TUTORS">Gia sư</option>
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Từ ngày</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Đến ngày</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              {reportError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {reportError}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExportReport}
                disabled={exporting}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? 'Đang tạo...' : 'Xuất CSV'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function getDefaultFromDate() {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date.toISOString().slice(0, 10)
}

function getInitials(name?: string) {
  if (!name) return 'AU'
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('')
}

function Svg({ children }: { children: ReactNode }) {
  return <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">{children}</svg>
}
function DashboardIcon() { return <Svg><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></Svg> }
function UsersIcon() { return <Svg><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Svg> }
function TutorIcon() { return <Svg><path d="m22 10-10-5-10 5 10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></Svg> }
function ClassIcon() { return <Svg><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 2v4M16 2v4M3 10h18M8 14h4M8 18h2" /></Svg> }
function TicketIcon() { return <Svg><path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" /><path d="M9 9h.01M15 15h.01M16 8l-8 8" /></Svg> }
function SupportIcon() { return <Svg><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H4zM17 14h3v5h-3z" /><path d="M13 19h2a5 5 0 0 0 5-5" /></Svg> }
function DisputeIcon() { return <Svg><path d="m4 19 5-5M14 4l6 6M5 5l14 14" /><path d="m12 6 6 6" /></Svg> }
function PayoutIcon() { return <Svg><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></Svg> }
function SettingsIcon() { return <Svg><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.03 3.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.4.25.74.6 1 1h.6a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" /></Svg> }
function LogoutIcon() { return <Svg><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></Svg> }
