import { useEffect, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { AccountPageContainer } from '../../components/AccountPageContainer'
import { TutorPageHeader } from '../../components/TutorPageHeader'
import {
  getTutorBalance,
  requestPayout,
  getPayoutHistory,
  getPendingOrders,
  type BalanceInfo,
  type PayoutHistoryItem,
  type PendingOrder,
} from '../../api/payout'
import { getTutorRevenue, getTutorRevenueMonthly, type TutorRevenueResponse, type MonthlyRevenueItem } from '../../api/order'
import {
  getFeeSummary,
  getPendingFees,
  getFeeHistory,
  payPlatformFee,
  type FeeSummary,
  type PendingFeeItem,
  type FeeHistoryItem,
} from '../../api/platformFee'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000).toLocaleString('vi-VN')}k`
  }
  return amount.toLocaleString('vi-VN')
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  }
  const labels: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    COMPLETED: 'Đã thanh toán',
    FAILED: 'Từ chối',
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  )
}

function RevenueTrendChart({
  monthlyRevenue,
  revenue,
  formatMonthLabel,
}: {
  monthlyRevenue: MonthlyRevenueItem[]
  revenue: TutorRevenueResponse
  formatMonthLabel: (month: string) => string
}) {
  const chartData = (monthlyRevenue.length > 0
    ? monthlyRevenue
    : [{
        month: 'TOTAL',
        totalAmount: revenue.totalAmount,
        platformFee: revenue.totalPlatformFee,
        tutorEarning: revenue.totalTutorEarning,
        orderCount: revenue.totalOrders,
      }]).map((item) => ({
        ...item,
        totalAmount: Number(item.totalAmount) || 0,
        platformFee: Number(item.platformFee) || 0,
        tutorEarning: Number(item.tutorEarning) || 0,
        orderCount: Number(item.orderCount) || 0,
      }))
  const maxValue = Math.max(...chartData.flatMap((item) => [item.totalAmount, item.tutorEarning, item.platformFee]), 1)
  const tickStep = Math.max(Math.ceil(maxValue / 4 / 50_000) * 50_000, 50_000)
  const chartMax = tickStep * 4
  const yTicks = Array.from({ length: 5 }, (_, index) => chartMax - tickStep * index)
  const bounds = { left: 76, right: 676, top: 34, bottom: 238 }
  const chartWidth = bounds.right - bounds.left
  const chartHeight = bounds.bottom - bounds.top
  const xForIndex = (index: number) => chartData.length > 1 ? bounds.left + (index * chartWidth) / (chartData.length - 1) : 366
  const yForValue = (value: number) => bounds.bottom - (value / chartMax) * chartHeight
  const toPoints = (key: 'totalAmount' | 'platformFee' | 'tutorEarning') =>
    chartData.map((item, index) => ({ x: xForIndex(index), y: yForValue(item[key]), item }))
  const tutorPoints = toPoints('tutorEarning')
  const platformPoints = toPoints('platformFee')
  const totalPoints = toPoints('totalAmount')
  const linePath = (points: typeof tutorPoints) => {
    if (points.length === 1) {
      const point = points[0]
      return `M ${point.x - 54} ${point.y} L ${point.x + 54} ${point.y}`
    }
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  }
  const areaPath = (points: typeof tutorPoints) => {
    if (points.length === 1) {
      const point = points[0]
      return `M ${point.x - 54} ${bounds.bottom} L ${point.x - 54} ${point.y} L ${point.x + 54} ${point.y} L ${point.x + 54} ${bounds.bottom} Z`
    }
    return `M ${points[0].x} ${bounds.bottom} ${points.map((point) => `L ${point.x} ${point.y}`).join(' ')} L ${points[points.length - 1].x} ${bounds.bottom} Z`
  }

  return (
    <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Biểu đồ doanh thu theo thời gian</h3>
          <p className="mt-1 text-sm text-slate-500">Theo dõi tổng học phí, phí nền tảng và số tiền gia sư thực nhận.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-400" /> Tổng học phí</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-orange-400" /> Phí nền tảng</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-600" /> Gia sư nhận</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-inner">
        <svg className="h-[340px] min-w-[720px] w-full" viewBox="0 0 720 340" role="img" aria-label="Biểu đồ doanh thu theo thời gian">
          <defs>
            <linearGradient id="tutorRevenueArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {yTicks.map((value) => {
            const y = yForValue(value)
            return (
              <g key={value}>
                <line x1={bounds.left} x2={bounds.right} y1={y} y2={y} stroke="#dbe3ef" strokeWidth="1" />
                <text x={bounds.left - 14} y={y + 4} textAnchor="end" fill="#64748b" fontSize="11" fontWeight="700">
                  {formatCompactCurrency(value)}
                </text>
              </g>
            )
          })}
          <line x1={bounds.left} x2={bounds.left} y1={bounds.top} y2={bounds.bottom} stroke="#cbd5e1" strokeWidth="1" />
          <line x1={bounds.left} x2={bounds.right} y1={bounds.bottom} y2={bounds.bottom} stroke="#94a3b8" strokeWidth="1.5" />

          <path d={areaPath(tutorPoints)} fill="url(#tutorRevenueArea)" />
          <path d={linePath(totalPoints)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 8" opacity="0.8" />
          <path d={linePath(platformPoints)} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={linePath(tutorPoints)} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {chartData.map((item, index) => {
            const x = xForIndex(index)
            const tutorY = yForValue(item.tutorEarning)
            const platformY = yForValue(item.platformFee)
            const totalY = yForValue(item.totalAmount)
            const label = item.month === 'TOTAL' ? 'Tổng' : formatMonthLabel(item.month)
            return (
              <g key={item.month} className="group">
                <line x1={x} x2={x} y1={bounds.top} y2={bounds.bottom} stroke="#cbd5e1" strokeWidth="1" opacity="0.28" />
                <circle cx={x} cy={totalY} r="4" fill="#fff" stroke="#10b981" strokeWidth="2.5" />
                <circle cx={x} cy={platformY} r="4.5" fill="#fff" stroke="#f97316" strokeWidth="3" />
                <circle cx={x} cy={tutorY} r="6" fill="#fff" stroke="#2563eb" strokeWidth="4" />
                <text x={x} y={totalY - 12} textAnchor="middle" fill="#059669" fontSize="11" fontWeight="800" stroke="#fff" strokeWidth="4" paintOrder="stroke">
                  {formatCompactCurrency(item.totalAmount)}
                </text>
                <text x={x} y={tutorY + 24} textAnchor="middle" fill="#1d4ed8" fontSize="11" fontWeight="800" stroke="#fff" strokeWidth="4" paintOrder="stroke">
                  {formatCompactCurrency(item.tutorEarning)}
                </text>
                <text x={x} y={platformY - 12} textAnchor="middle" fill="#ea580c" fontSize="11" fontWeight="800" stroke="#fff" strokeWidth="4" paintOrder="stroke">
                  {formatCompactCurrency(item.platformFee)}
                </text>
                <text x={x} y="278" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="700">{label}</text>
                <text x={x} y="296" textAnchor="middle" fill="#94a3b8" fontSize="11">{item.orderCount} đơn</text>

                <g className="opacity-0 transition group-hover:opacity-100">
                  <rect x={Math.min(Math.max(x - 92, 10), 526)} y="12" width="184" height="90" rx="12" fill="#0f172a" />
                  <text x={Math.min(Math.max(x - 78, 24), 540)} y="36" fill="#fff" fontSize="12" fontWeight="700">{label} • {item.orderCount} đơn</text>
                  <text x={Math.min(Math.max(x - 78, 24), 540)} y="58" fill="#bbf7d0" fontSize="11">Tổng: {formatCurrency(item.totalAmount)}</text>
                  <text x={Math.min(Math.max(x - 78, 24), 540)} y="76" fill="#bfdbfe" fontSize="11">Gia sư nhận: {formatCurrency(item.tutorEarning)}</text>
                  <text x={Math.min(Math.max(x - 78, 24), 540)} y="94" fill="#fed7aa" fontSize="11">Phí nền tảng: {formatCurrency(item.platformFee)}</text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export function TutorPayout() {
  const [balance, setBalance] = useState<BalanceInfo | null>(null)
  const [history, setHistory] = useState<PayoutHistoryItem[]>([])
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Revenue chart state
  const [revenue, setRevenue] = useState<TutorRevenueResponse | null>(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueItem[]>([])
  const [revenueLoading, setRevenueLoading] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Platform fee state
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null)
  const [pendingFees, setPendingFees] = useState<PendingFeeItem[]>([])
  const [feeHistory, setFeeHistory] = useState<FeeHistoryItem[]>([])
  const [payingFeeId, setPayingFeeId] = useState<number | null>(null)

  // Form state
  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankHolder, setBankHolder] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const [bal, hist, orders] = await Promise.all([
        getTutorBalance(),
        getPayoutHistory(),
        getPendingOrders(),
      ])
      setBalance(bal)
      setHistory(hist)
      setPendingOrders(orders)
    } catch (err: any) {
      console.error('Failed to load payout data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadRevenue = async () => {
    try {
      setRevenueLoading(true)
      const userRaw = localStorage.getItem('user')
      if (!userRaw) return
      const user = JSON.parse(userRaw)
      const tutorId = user.id
      if (!tutorId) return

      try {
        const aggregate = await getTutorRevenue(tutorId, fromDate || undefined, toDate || undefined)
        setRevenue(aggregate)
      } catch (err) {
        console.error('Failed to load aggregate revenue:', err)
      }

      try {
        const monthly = await getTutorRevenueMonthly(tutorId, fromDate || undefined, toDate || undefined)
        setMonthlyRevenue(monthly)
      } catch (err) {
        console.error('Monthly revenue API not available yet (need backend restart):', err)
        setMonthlyRevenue([])
      }
    } finally {
      setRevenueLoading(false)
    }
  }

  const loadPlatformFeeData = async () => {
    try {
      const [summary, pending, hist] = await Promise.all([
        getFeeSummary(),
        getPendingFees(),
        getFeeHistory(),
      ])
      setFeeSummary(summary)
      setPendingFees(pending)
      setFeeHistory(hist)
    } catch (err: any) {
      console.error('Failed to load platform fee data:', err)
    }
  }

  const handlePayFee = async (feePaymentId: number) => {
    try {
      setPayingFeeId(feePaymentId)
      const result = await payPlatformFee(feePaymentId)
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      }
    } catch (err: any) {
      console.error('Failed to pay platform fee:', err)
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi thanh toán phí nền tảng')
    } finally {
      setPayingFeeId(null)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadRevenue()
  }, [fromDate, toDate])

  useEffect(() => {
    loadPlatformFeeData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ')
      return
    }
    if (!bankName.trim() || !bankAccount.trim() || !bankHolder.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin ngân hàng')
      return
    }

    try {
      setSubmitting(true)
      await requestPayout({
        amount: amountNum,
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        bankHolder: bankHolder.trim(),
        note: note.trim(),
      })
      setSuccess('Yêu cầu rút tiền đã được gửi thành công!')
      setShowRequestForm(false)
      setAmount('')
      setBankName('')
      setBankAccount('')
      setBankHolder('')
      setNote('')
      loadData()
      loadRevenue()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  function formatMonthLabel(month: string) {
    const [y, m] = month.split('-')
    const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']
    return `${months[parseInt(m) - 1]}/${y.slice(2)}`
  }

  const pendingPayoutAmount = balance?.pendingPayoutAmount ?? 0
  const withdrawableBalance = balance?.withdrawableBalance ?? balance?.availableBalance ?? 0

  return (
    <AccountLayout activePath="/tutor/payout">
      <AccountPageContainer>
        <TutorPageHeader title="Rút tiền" />
        {loading ? (
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            Đang tải dữ liệu rút tiền...
          </div>
        ) : null}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Số dư khả dụng</p>
            <p className="text-2xl font-bold text-green-600">
              {balance ? formatCurrency(balance.availableBalance) : '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Đã rút thành công</p>
            <p className="text-2xl font-bold text-blue-600">
              {balance ? formatCurrency(balance.totalPaidOut) : '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Đang chờ xử lý</p>
            <p className="text-2xl font-bold text-amber-600">
              {balance ? formatCurrency(pendingPayoutAmount) : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Có thể yêu cầu thêm: {balance ? formatCurrency(withdrawableBalance) : '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-end justify-end">
            <button
              onClick={() => {
                setShowRequestForm(true)
                setError('')
                setSuccess('')
              }}
              disabled={!balance || withdrawableBalance <= 0}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Yêu cầu rút tiền
            </button>
          </div>
        </div>

        {/* Revenue Chart Section - admin reports style */}
        <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-950">Thống kê doanh thu</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
              <span className="h-3 w-3 rounded-full bg-blue-700" /> Doanh thu ròng
            </span>
          </div>

          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Tổng số đơn</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{revenue?.totalOrders ?? 0}</p>
              <p className="mt-2 text-sm font-bold text-slate-600">Đã hoàn thành</p>
            </div>
            <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Doanh thu</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{revenue ? formatCurrency(revenue.totalAmount) : '—'}</p>
              <p className="mt-2 text-sm font-bold text-emerald-700">Tổng học phí</p>
            </div>
            <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Phí nền tảng (10%)</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">{revenue ? formatCurrency(revenue.totalPlatformFee) : '—'}</p>
              <p className="mt-2 text-sm font-bold text-orange-600">Trích từ doanh thu</p>
            </div>
            <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Gia sư nhận (90%)</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">{revenue ? formatCurrency(revenue.totalTutorEarning) : '—'}</p>
              <p className="mt-2 text-sm font-bold text-blue-700">Thực nhận</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Từ</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đến</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {revenueLoading ? (
            <div className="rounded-lg border border-blue-100 bg-white/80 px-4 py-3 text-sm font-semibold text-blue-700">Đang tải dữ liệu...</div>
          ) : revenue && revenue.totalOrders > 0 ? (
            <div className="rounded-xl border border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50/70 p-5">
              <RevenueTrendChart
                monthlyRevenue={monthlyRevenue}
                revenue={revenue}
                formatMonthLabel={formatMonthLabel}
              />
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-orange-400" /> Phí nền tảng (10%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-500" /> Gia sư nhận (90%)
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center">
              <p className="text-sm font-bold text-slate-950">Chưa có dữ liệu</p>
              <p className="mt-2 text-sm text-slate-500">Chưa có dữ liệu doanh thu trong khoảng thời gian này</p>
            </div>
          )}
        </section>

        {/* Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Yêu cầu rút tiền</h2>
              <p className="text-xs text-slate-500 mb-4">
                Nhập thông tin <strong>tài khoản ngân hàng CÁ NHÂN</strong> của bạn để nhận tiền. 
                Admin sẽ chuyển khoản thủ công sau khi duyệt.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Số tiền rút <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Nhập số tiền"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      min="1000"
                      step="1000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">VND</span>
                  </div>
                  {balance && (
                    <p className="text-xs text-slate-400 mt-1">
                      Số dư khả dụng: {formatCurrency(balance.availableBalance)}
                      {pendingPayoutAmount > 0 ? ` • Đang chờ xử lý: ${formatCurrency(pendingPayoutAmount)} • Có thể yêu cầu thêm: ${formatCurrency(withdrawableBalance)}` : ''}
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Thông tin nhận tiền (tài khoản ngân hàng cá nhân)</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ngân hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="VD: Vietcombank, Techcombank..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Số tài khoản <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="Nhập số tài khoản"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Chủ tài khoản <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankHolder}
                        onChange={(e) => setBankHolder(e.target.value)}
                        placeholder="Nhập tên chủ tài khoản"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ghi chú
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ghi chú thêm (không bắt buộc)"
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pending Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">
              Chi tiết doanh thu chờ thanh toán ({pendingOrders.length} đơn)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-5 py-3 font-medium">Lớp học</th>
                  <th className="text-right px-5 py-3 font-medium">Học phí</th>
                  <th className="text-right px-5 py-3 font-medium">Phí nền tảng (10%)</th>
                  <th className="text-right px-5 py-3 font-medium">Gia sư nhận (90%)</th>
                  <th className="text-right px-5 py-3 font-medium">Ngày thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      Chưa có doanh thu nào
                    </td>
                  </tr>
                ) : (
                  pendingOrders.map((order) => (
                    <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-800">{order.className}</td>
                      <td className="px-5 py-3 text-right text-slate-800">{formatCurrency(order.amount)}</td>
                      <td className="px-5 py-3 text-right text-slate-500">{formatCurrency(order.platformFee)}</td>
                      <td className="px-5 py-3 text-right text-green-600 font-medium">
                        {formatCurrency(order.tutorPayoutRemainingAmount ?? order.tutorEarning)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500">{formatDate(order.paidAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Fee Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Phí nền tảng chưa thanh toán
              {feeSummary && feeSummary.pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                  {feeSummary.pendingCount} khoản
                </span>
              )}
            </h2>
            {feeSummary && feeSummary.totalPendingFee > 0 && (
              <span className="text-orange-600 font-bold">
                Tổng: {formatCurrency(feeSummary.totalPendingFee)}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-5 py-3 font-medium">Mã</th>
                  <th className="text-right px-5 py-3 font-medium">Số tiền</th>
                  <th className="text-left px-5 py-3 font-medium">Trạng thái</th>
                  <th className="text-right px-5 py-3 font-medium">Ngày tạo</th>
                  <th className="text-center px-5 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingFees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      Không có phí nền tảng nào cần thanh toán
                    </td>
                  </tr>
                ) : (
                  pendingFees.map((fee) => (
                    <tr key={fee.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500">#{fee.id}</td>
                      <td className="px-5 py-3 text-right font-medium text-orange-600">
                        {formatCurrency(fee.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Chờ thanh toán
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500">{formatDate(fee.createdAt)}</td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handlePayFee(fee.id)}
                          disabled={payingFeeId === fee.id}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                        >
                          {payingFeeId === fee.id ? 'Đang xử lý...' : 'Thanh toán VNPAY'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lịch sử thanh toán phí nền tảng */}
        {feeHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Lịch sử thanh toán phí nền tảng</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="text-left px-5 py-3 font-medium">Mã</th>
                    <th className="text-right px-5 py-3 font-medium">Số tiền</th>
                    <th className="text-left px-5 py-3 font-medium">Trạng thái</th>
                    <th className="text-left px-5 py-3 font-medium">Mã GD VNPAY</th>
                    <th className="text-right px-5 py-3 font-medium">Ngày thanh toán</th>
                  </tr>
                </thead>
                <tbody>
                  {feeHistory.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500">#{item.id}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-800">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          item.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status === 'PAID' ? 'Đã thanh toán' :
                           item.status === 'FAILED' ? 'Thất bại' : 'Chờ thanh toán'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{item.vnpTransactionNo || '—'}</td>
                      <td className="px-5 py-3 text-right text-slate-500">{formatDate(item.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payout History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Lịch sử rút tiền</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-5 py-3 font-medium">Mã</th>
                  <th className="text-right px-5 py-3 font-medium">Số tiền</th>
                  <th className="text-left px-5 py-3 font-medium">Ngân hàng</th>
                  <th className="text-left px-5 py-3 font-medium">Trạng thái</th>
                  <th className="text-left px-5 py-3 font-medium">Ghi chú</th>
                  <th className="text-right px-5 py-3 font-medium">Ngày tạo</th>
                  <th className="text-right px-5 py-3 font-medium">Ngày xử lý</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                      Chưa có lịch sử rút tiền
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500">#{item.id}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-800">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {item.bankName ? `${item.bankName} - ${item.bankAccount}` : '—'}
                      </td>
                      <td className="px-5 py-3">{getStatusBadge(item.status)}</td>
                      <td className="px-5 py-3 text-slate-500 max-w-[150px] truncate">
                        {item.note || '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="px-5 py-3 text-right text-slate-500">{formatDate(item.completedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AccountPageContainer>
    </AccountLayout>
  )
}



