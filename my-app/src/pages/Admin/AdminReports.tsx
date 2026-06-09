import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  exportAdminReport,
  getCurrentAdmin,
  getAdminReportPreview,
  type AdminReportType,
  type AdminReportPreview,
  type AdminSession,
} from '../../api/admin'
import { AdminLayout } from '../../components/AdminLayout'

type ReportCardType = AdminReportType | 'USERS' | 'TUTORS'
type ExportFormat = 'PDF' | 'EXCEL' | 'CSV'
type DatePreset = '7D' | '30D' | 'QUARTER'

interface ReportHistoryItem {
  id: string
  type: ReportCardType
  format: ExportFormat
  fromDate: string
  toDate: string
  createdAt: string
  fileName: string
}

const reportTypes: Array<{
  type: ReportCardType
  label: string
  icon: ReactNode
  enabled: boolean
}> = [
  { type: 'DASHBOARD', label: 'Doanh thu', icon: <MoneyIcon />, enabled: true },
  { type: 'USERS', label: 'Người dùng', icon: <TrendIcon />, enabled: false },
  { type: 'TUTORS', label: 'Gia sư', icon: <BadgeIcon />, enabled: false },
  { type: 'DISPUTES', label: 'Tranh chấp', icon: <WarningIcon />, enabled: true },
]

const emptyReportPreview: AdminReportPreview = {
  metrics: [],
  chart: [],
  rows: [],
}

export function AdminReports() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [reportType, setReportType] = useState<ReportCardType>('DASHBOARD')
  const [format, setFormat] = useState<ExportFormat>('CSV')
  const [preset, setPreset] = useState<DatePreset>('30D')
  const [fromDate, setFromDate] = useState(() => getDateBefore(30))
  const [toDate, setToDate] = useState(() => today())
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<ReportHistoryItem[]>(() => loadReportHistory())
  const [preview, setPreview] = useState<AdminReportPreview>(emptyReportPreview)
  const [loadingPreview, setLoadingPreview] = useState(false)

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
      .finally(() => setChecking(false))
  }, [])

  const selectedReport = reportTypes.find((item) => item.type === reportType)
  const canExport = selectedReport?.enabled && format === 'CSV'
  const canPreview = reportType === 'DASHBOARD' || reportType === 'DISPUTES'

  const chartLabel = useMemo(() => {
    if (reportType === 'DISPUTES') return 'Xu hướng Tranh chấp'
    if (reportType === 'DASHBOARD') return 'Xu hướng Doanh thu'
    return 'Dữ liệu xem trước'
  }, [reportType])
  const chartData = preview.chart.length > 0 ? preview.chart : [{ label: '-', value: 0 }]
  const chartMax = Math.max(...chartData.map((item) => item.value), 1)
  const chartLine = chartData
    .map((item, index) => {
      const x = 36 + (index * 608) / Math.max(chartData.length - 1, 1)
      const y = 250 - (item.value / chartMax) * 190
      return `${x},${y}`
    })
    .join(' ')
  const chartArea = `36,250 ${chartLine} 644,250`

  useEffect(() => {
    if (!canPreview) {
      setPreview(emptyReportPreview)
      return
    }

    let active = true
    setLoadingPreview(true)
    getAdminReportPreview({
      type: reportType as AdminReportType,
      from: fromDate,
      to: toDate,
    })
      .then((data) => {
        if (active) setPreview(normalizeReportPreview(data))
      })
      .catch(() => {
        if (active) setPreview(emptyReportPreview)
      })
      .finally(() => {
        if (active) setLoadingPreview(false)
      })

    return () => {
      active = false
    }
  }, [canPreview, reportType, fromDate, toDate])

  function applyPreset(nextPreset: DatePreset) {
    setPreset(nextPreset)
    if (nextPreset === '7D') {
      setFromDate(getDateBefore(7))
      setToDate(today())
    } else if (nextPreset === '30D') {
      setFromDate(getDateBefore(30))
      setToDate(today())
    } else {
      const now = new Date()
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      const start = new Date(now.getFullYear(), quarterStartMonth, 1)
      setFromDate(toDateInput(start))
      setToDate(today())
    }
  }

  async function handleExport() {
    setError('')

    if (!canExport) {
      setError('Hiện tại hệ thống chỉ hỗ trợ xuất CSV cho báo cáo Tổng quan và Tranh chấp.')
      return
    }

    setExporting(true)
    try {
      const blob = await exportAdminReport({
        type: reportType as AdminReportType,
        from: fromDate,
        to: toDate,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const fileName = `edumatch-${reportType.toLowerCase()}-${toDate || today()}.csv`
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      const nextHistory = [
        {
          id: `${Date.now()}`,
          type: reportType,
          format,
          fromDate,
          toDate,
          createdAt: new Date().toISOString(),
          fileName,
        },
        ...history,
      ].slice(0, 20)
      setHistory(nextHistory)
      saveReportHistory(nextHistory)
    } catch {
      setError('Không thể tạo báo cáo. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-sm font-semibold text-slate-600">
        Đang kiểm tra quyền quản trị...
      </div>
    )
  }

  return (
    <AdminLayout activePath="/admin/reports" adminName={admin?.fullName}>
      <div className="space-y-7">
        <section className="flex items-start justify-between gap-4">
          <div>
            <a href="/admin" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline">
              <ArrowLeftIcon /> Quay lại
            </a>
            <div role="heading" aria-level={1} className="text-3xl font-extrabold tracking-tight text-slate-950">
              Tạo Báo cáo
            </div>
            <p className="mt-1 text-base text-slate-700">Phân tích và trích xuất dữ liệu hệ thống EduMatch Pro</p>
          </div>
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="mt-16 inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <HistoryIcon /> Lịch sử báo cáo
            </button>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(390px,0.92fr)_minmax(0,1.32fr)]">
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
              <SectionTitle icon={<ReportIcon />} title="Loại báo cáo" />
              <div className="mt-5 grid grid-cols-2 gap-4">
                {reportTypes.map((item) => {
                  const selected = reportType === item.type
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setReportType(item.type)}
                      className={`flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border p-4 text-center transition ${
                        selected
                          ? 'border-blue-700 bg-blue-50 text-blue-700 ring-1 ring-blue-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40'
                      } ${!item.enabled ? 'opacity-70' : ''}`}
                    >
                      <span className="[&_svg]:h-7 [&_svg]:w-7">{item.icon}</span>
                      <span className="font-bold">{item.label}</span>
                      {!item.enabled ? <span className="text-xs font-semibold text-slate-400">Sắp có</span> : null}
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
              <SectionTitle icon={<CalendarIcon />} title="Khoảng thời gian" />
              <div className="mt-5 grid grid-cols-3 rounded-lg bg-slate-100 p-1">
                <PresetButton active={preset === '7D'} onClick={() => applyPreset('7D')}>7 Ngày qua</PresetButton>
                <PresetButton active={preset === '30D'} onClick={() => applyPreset('30D')}>30 Ngày</PresetButton>
                <PresetButton active={preset === 'QUARTER'} onClick={() => applyPreset('QUARTER')}>Quý này</PresetButton>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <DateField label="Từ ngày" value={fromDate} onChange={setFromDate} />
                <DateField label="Đến ngày" value={toDate} onChange={setToDate} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
              <SectionTitle icon={<ExportIcon />} title="Định dạng xuất" />
              <div className="mt-5 grid grid-cols-3 gap-4">
                <FormatButton label="PDF" value="PDF" selected={format === 'PDF'} onClick={setFormat} color="text-red-600" />
                <FormatButton label="Excel" value="EXCEL" selected={format === 'EXCEL'} onClick={setFormat} color="text-emerald-700" />
                <FormatButton label="CSV" value="CSV" selected={format === 'CSV'} onClick={setFormat} color="text-blue-700" />
              </div>
              {error ? (
                <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-blue-700 text-base font-bold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <DownloadIcon /> {exporting ? 'Đang tạo báo cáo...' : 'Tải Báo Cáo Ngay'}
              </button>
            </section>
          </div>

          <div className="space-y-6">
            <section className="grid gap-5 md:grid-cols-3">
              {buildMetricCards(preview, reportType).map((metric, index) => (
                <MiniMetric
                  key={metric.label}
                  label={metric.label}
                  value={formatMetricValue(metric.value, reportType, index)}
                  detail={metric.detail || 'Chưa có dữ liệu'}
                  tone={index === 0 ? 'text-blue-700' : index === 2 ? 'text-red-700' : 'text-slate-950'}
                />
              ))}
            </section>

            <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-950">{chartLabel} ({getPresetLabel(preset)})</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
                  <span className="h-3 w-3 rounded-full bg-blue-700" /> {reportType === 'DISPUTES' ? 'Tranh chấp' : 'Doanh thu ròng'}
                </span>
              </div>
              <div className="mt-8 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/70 p-5">
                {loadingPreview ? (
                  <div className="mb-5 rounded-lg border border-blue-100 bg-white/80 px-4 py-3 text-sm font-semibold text-blue-700">
                    Đang tải dữ liệu thật từ hệ thống...
                  </div>
                ) : null}
                <div className="mb-5 grid gap-3 sm:grid-cols-3">
                  <ChartSummary label="Cao nhất" value={formatChartValue(Math.max(...chartData.map((item) => item.value)), reportType)} />
                  <ChartSummary label="Trung bình" value={formatChartValue(Math.round(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length), reportType)} />
                  <ChartSummary label="Điểm dữ liệu" value={`${chartData.length}`} />
                </div>

                <div className="relative overflow-hidden rounded-lg bg-white p-4 shadow-inner">
                  <svg className="h-80 w-full" viewBox="0 0 680 300" role="img" aria-label={chartLabel}>
                    <defs>
                      <linearGradient id="reportChartArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0b63ce" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#0b63ce" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {[60, 108, 156, 204, 252].map((y) => (
                      <line key={y} x1="36" x2="644" y1={y} y2={y} stroke="#d8dee9" strokeWidth="1" />
                    ))}
                    {chartData.map((item, index) => {
                      const x = 36 + (index * 608) / Math.max(chartData.length - 1, 1)
                      const height = (item.value / chartMax) * 150
                      return (
                        <rect
                          key={`bar-${item.label}`}
                          x={x - 10}
                          y={250 - height}
                          width="20"
                          height={height}
                          rx="7"
                          fill="#60a5fa"
                          opacity="0.32"
                        />
                      )
                    })}
                    <polygon points={chartArea} fill="url(#reportChartArea)" />
                    <polyline points={chartLine} fill="none" stroke="#075ec8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    {chartData.map((item, index) => {
                      const x = 36 + (index * 608) / Math.max(chartData.length - 1, 1)
                      const y = 250 - (item.value / chartMax) * 190
                      return (
                        <g key={`point-${item.label}`} className="group">
                          <circle cx={x} cy={y} r="6" fill="#ffffff" stroke="#075ec8" strokeWidth="4" />
                          <circle cx={x} cy={y} r="16" fill="transparent" />
                          <g className="opacity-0 transition group-hover:opacity-100">
                            <rect x={Math.min(Math.max(x - 48, 8), 584)} y={Math.max(y - 46, 8)} width="88" height="30" rx="8" fill="#0f172a" />
                            <text x={Math.min(Math.max(x - 4, 52), 628)} y={Math.max(y - 27, 27)} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                              {formatChartValue(item.value, reportType)}
                            </text>
                          </g>
                        </g>
                      )
                    })}
                    {chartData.map((item, index) => {
                      const x = 36 + (index * 608) / Math.max(chartData.length - 1, 1)
                      return (
                        <text key={`label-${item.label}`} x={x} y="284" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="600">
                          {item.label}
                        </text>
                      )
                    })}
                  </svg>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-300 px-6 py-5">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">
                  {reportType === 'DISPUTES' ? 'Top 5 tranh chấp gần đây' : 'Top 5 giao dịch gần đây'}
                </h2>
                <span className="text-sm font-bold text-slate-500">{preview.rows.length} bản ghi</span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Mã GD</th>
                    <th className="px-6 py-4 font-semibold">Ngày</th>
                    <th className="px-6 py-4 font-semibold">Gia sư</th>
                    <th className="px-6 py-4 font-semibold">Học viên</th>
                    <th className="px-6 py-4 text-right font-semibold">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {preview.rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm font-semibold text-slate-500">
                        Chưa có dữ liệu trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  ) : preview.rows.map((row) => (
                    <tr key={row.code}>
                      <td className="px-6 py-4 font-mono font-semibold text-blue-700">{row.code}</td>
                      <td className="px-6 py-4">{formatRowDate(row.date)}</td>
                      <td className="px-6 py-4">{row.tutorName || '-'}</td>
                      <td className="px-6 py-4">{row.studentName || '-'}</td>
                      <td className="px-6 py-4 text-right font-bold">{formatMoney(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="flex gap-6 rounded-2xl border border-blue-100 bg-blue-50 p-8">
            <div className="hidden h-32 w-32 shrink-0 rounded-xl bg-gradient-to-br from-blue-200 to-cyan-100 md:block" />
            <div>
              <h2 className="text-2xl font-bold text-blue-700">Tự động hóa báo cáo</h2>
              <p className="mt-3 text-base leading-7 text-slate-700">
                Lên lịch gửi báo cáo hằng tuần trực tiếp qua email cho ban quản trị. Tiết kiệm 5 giờ làm việc mỗi tuần.
              </p>
              <button className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                Thiết lập ngay <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-300 bg-blue-100 p-8">
            <h2 className="text-2xl font-bold text-slate-950">Cần báo cáo tùy chỉnh?</h2>
            <p className="mt-3 max-w-lg text-base leading-7 text-slate-700">
              Nếu các mẫu có sẵn chưa đáp ứng nhu cầu, hãy liên hệ đội ngũ kỹ thuật để khởi tạo cấu trúc dữ liệu riêng.
            </p>
            <a href="/admin/support" className="mt-5 inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-900 shadow-sm">
              Yêu cầu hỗ trợ
            </a>
            <div className="absolute right-10 top-12 text-blue-300 [&_svg]:h-20 [&_svg]:w-20">
              <HelpIcon />
            </div>
          </div>
        </section>
      </div>

      {showHistory ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Lịch sử báo cáo</h2>
                <p className="mt-1 text-sm text-slate-500">20 báo cáo được tạo gần nhất trên trình duyệt này.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="max-h-[520px] overflow-y-auto p-6">
              {history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center">
                  <p className="text-sm font-bold text-slate-950">Chưa có báo cáo nào</p>
                  <p className="mt-2 text-sm text-slate-500">Sau khi bạn tải báo cáo thành công, lịch sử sẽ hiển thị tại đây.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-5 py-3 font-bold">Loại báo cáo</th>
                        <th className="px-5 py-3 font-bold">Định dạng</th>
                        <th className="px-5 py-3 font-bold">Khoảng thời gian</th>
                        <th className="px-5 py-3 font-bold">Thời điểm tạo</th>
                        <th className="px-5 py-3 text-right font-bold">File</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 font-semibold text-slate-950">{getReportLabel(item.type)}</td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{item.format}</span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{formatDateLabel(item.fromDate)} - {formatDateLabel(item.toDate)}</td>
                          <td className="px-5 py-4 text-slate-600">{formatDateTime(item.createdAt)}</td>
                          <td className="px-5 py-4 text-right font-mono text-xs text-slate-500">{item.fileName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 border-t border-slate-200 p-6">
              <button
                type="button"
                onClick={() => {
                  setHistory([])
                  saveReportHistory([])
                }}
                disabled={history.length === 0}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Xóa lịch sử
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-blue-700 [&_svg]:h-6 [&_svg]:w-6">{icon}</span>
      <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
    </div>
  )
}

function PresetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-md text-sm font-bold transition ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-700 hover:bg-white/70'}`}
    >
      {children}
    </button>
  )
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold text-slate-800">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  )
}

function FormatButton({ label, value, selected, onClick, color }: { label: string; value: ExportFormat; selected: boolean; onClick: (value: ExportFormat) => void; color: string }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border text-sm font-bold transition ${
        selected ? 'border-blue-700 bg-blue-50 text-slate-950 ring-1 ring-blue-700' : 'border-slate-300 bg-white text-slate-900 hover:border-blue-300'
      }`}
    >
      <span className={color}><FileIcon /></span>
      {label}
    </button>
  )
}

function MiniMetric({ label, value, detail, tone = 'text-slate-950' }: { label: string; value: string; detail: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
      <p className={`mt-3 text-sm font-bold ${tone === 'text-red-700' ? 'text-red-700' : tone === 'text-blue-700' ? 'text-emerald-700' : 'text-slate-700'}`}>{detail}</p>
    </div>
  )
}

function ChartSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white/80 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-950">{value}</p>
    </div>
  )
}

function normalizeReportPreview(data: AdminReportPreview): AdminReportPreview {
  return {
    metrics: Array.isArray(data.metrics) ? data.metrics : [],
    chart: Array.isArray(data.chart) ? data.chart.map((point) => ({
      label: point.label || '-',
      value: Number(point.value) || 0,
    })) : [],
    rows: Array.isArray(data.rows) ? data.rows.map((row) => ({
      code: row.code || '-',
      date: row.date || null,
      tutorName: row.tutorName || '-',
      studentName: row.studentName || '-',
      amount: Number(row.amount) || 0,
    })) : [],
  }
}

function buildMetricCards(preview: AdminReportPreview, type: ReportCardType) {
  if (preview.metrics.length > 0) return preview.metrics

  return type === 'DISPUTES'
    ? [
        { label: 'Tổng tranh chấp', value: 0, detail: 'Chưa có dữ liệu' },
        { label: 'Đang xử lý', value: 0, detail: 'Chưa có dữ liệu' },
        { label: 'Tỷ lệ đã giải quyết', value: 0, detail: 'Chưa có dữ liệu' },
      ]
    : [
        { label: 'Tổng doanh thu', value: 0, detail: 'Chưa có dữ liệu' },
        { label: 'Học phí trung bình', value: 0, detail: 'Chưa có dữ liệu' },
        { label: 'Tỷ lệ hoàn tiền', value: 0, detail: 'Chưa có dữ liệu' },
      ]
}

function formatMetricValue(value: number, type: ReportCardType, index: number) {
  if (type === 'DISPUTES') {
    if (index === 2) return `${Number(value || 0).toLocaleString('vi-VN')}%`
    return Number(value || 0).toLocaleString('vi-VN')
  }

  if (index === 2) return `${Number(value || 0).toLocaleString('vi-VN')}%`
  return formatMoney(value)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatRowDate(value: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function today() {
  return toDateInput(new Date())
}

function getDateBefore(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toDateInput(date)
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getPresetLabel(preset: DatePreset) {
  if (preset === '7D') return '7 ngày qua'
  if (preset === 'QUARTER') return 'quý này'
  return '30 ngày qua'
}

function formatChartValue(value: number, type?: ReportCardType) {
  if (type === 'DISPUTES') return `${Number(value || 0).toLocaleString('vi-VN')} vụ`
  return formatMoney(value)
}

const REPORT_HISTORY_KEY = 'admin_report_history'

function loadReportHistory(): ReportHistoryItem[] {
  try {
    const rawHistory = localStorage.getItem(REPORT_HISTORY_KEY)
    if (!rawHistory) return []

    const parsedHistory = JSON.parse(rawHistory)
    return Array.isArray(parsedHistory) ? parsedHistory : []
  } catch {
    return []
  }
}

function saveReportHistory(items: ReportHistoryItem[]) {
  localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(items))
}

function getReportLabel(type: ReportCardType) {
  return reportTypes.find((report) => report.type === type)?.label ?? type
}

function formatDateLabel(value: string) {
  if (!value) return 'Không chọn'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
}

function Svg({ children, className = 'h-5 w-5' }: { children: ReactNode; className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">{children}</svg>
}
function ArrowLeftIcon() { return <Svg><path d="M19 12H5M12 19l-7-7 7-7" /></Svg> }
function HistoryIcon() { return <Svg><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></Svg> }
function ReportIcon() { return <Svg><path d="M4 20h16M6 16V8l6-4 6 4v8" /><path d="M8 16h3v4H8zM13 12h3v8h-3z" /></Svg> }
function CalendarIcon() { return <Svg><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></Svg> }
function ExportIcon() { return <Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" /></Svg> }
function MoneyIcon() { return <Svg><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></Svg> }
function TrendIcon() { return <Svg><path d="m3 17 6-6 4 4 8-8" /><path d="M14 7h7v7" /></Svg> }
function BadgeIcon() { return <Svg><circle cx="12" cy="8" r="4" /><path d="M8 12v9l4-2 4 2v-9" /></Svg> }
function WarningIcon() { return <Svg><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></Svg> }
function DownloadIcon() { return <Svg><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></Svg> }
function FileIcon() { return <Svg><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></Svg> }
function HelpIcon() { return <Svg><path d="M9.1 9a3 3 0 1 1 5.8 1c-.6 1-1.7 1.4-2.4 2.2-.4.5-.5.9-.5 1.8" /><path d="M12 18h.01" /><circle cx="12" cy="12" r="10" /></Svg> }
function ChevronRightIcon() { return <Svg><path d="m9 18 6-6-6-6" /></Svg> }
