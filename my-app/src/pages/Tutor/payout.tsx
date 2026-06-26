import { useEffect, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
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

      // Gọi aggregate (luôn available)
      try {
        const aggregate = await getTutorRevenue(tutorId, fromDate || undefined, toDate || undefined)
        setRevenue(aggregate)
      } catch (err) {
        console.error('Failed to load aggregate revenue:', err)
      }

      // Gọi monthly (có thể fail nếu backend chưa update)
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

  useEffect(() => {
    loadData()
  }, [])

  // Load revenue when component mounts AND when user changes date
  useEffect(() => {
    loadRevenue()
  }, [fromDate, toDate])

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

  // Tính toán cho biểu đồ cột
  // Nếu có monthly data: vẽ theo tháng. Nếu không: vẽ 2 cột tổng
  const hasMonthly = monthlyRevenue.length > 0
  const monthlyMax = hasMonthly
    ? Math.max(...monthlyRevenue.flatMap(m => [m.platformFee, m.tutorEarning]), 1)
    : 1

  function formatMonthLabel(month: string) {
    const [y, m] = month.split('-')
    const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']
    return `${months[parseInt(m) - 1]}/${y.slice(2)}`
  }

  return (
    <AccountLayout activePath="/tutor/payout">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Rút tiền</h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-end justify-end">
            <button
              onClick={() => {
                setShowRequestForm(true)
                setError('')
                setSuccess('')
              }}
              disabled={!balance || balance.availableBalance <= 0}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Yêu cầu rút tiền
            </button>
          </div>
        </div>

        {/* Revenue Chart Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Thống kê doanh thu</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Từ</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-8 px-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Đến</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-8 px-2 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {revenueLoading ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">Đang tải...</div>
          ) : revenue && revenue.totalOrders > 0 ? (
            <div className="p-5">
              {/* Summary numbers */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Tổng số đơn</p>
                  <p className="text-2xl font-bold text-blue-800 mt-1">{revenue.totalOrders}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Doanh thu</p>
                  <p className="text-2xl font-bold text-green-800 mt-1">{formatCurrency(revenue.totalAmount)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Phí nền tảng (10%)</p>
                  <p className="text-2xl font-bold text-orange-800 mt-1">{formatCurrency(revenue.totalPlatformFee)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Gia sư nhận (90%)</p>
                  <p className="text-2xl font-bold text-purple-800 mt-1">{formatCurrency(revenue.totalTutorEarning)}</p>
                </div>
              </div>

              {/* Bar chart - monthly (nếu có) hoặc tổng hợp (nếu monthly chưa available) */}
              <div className="mt-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  {hasMonthly ? 'Biểu đồ doanh thu theo tháng' : 'So sánh doanh thu'}
                </h3>
                <div className="overflow-x-auto pb-2">
                  <div className="flex items-end gap-4 min-w-[400px] h-52 border-b border-slate-200 px-2">
                    {hasMonthly ? (
                      monthlyRevenue.map((item) => {
                        const pfPct = (item.platformFee / monthlyMax) * 100
                        const tePct = (item.tutorEarning / monthlyMax) * 100
                        return (
                          <div key={item.month} className="flex-1 flex flex-col items-center gap-1 min-w-[50px]">
                            <span className="text-[10px] font-medium text-orange-500 whitespace-nowrap">
                              {formatCurrency(item.platformFee)}
                            </span>
                            <div className="flex items-end gap-[3px] w-full justify-center">
                              <div
                                className="w-[18px] rounded-t bg-orange-400 transition-all duration-500"
                                style={{ height: `${Math.max(pfPct, 3)}%` }}
                                title={`Phí nền tảng: ${formatCurrency(item.platformFee)}`}
                              />
                              <div
                                className="w-[18px] rounded-t bg-purple-500 transition-all duration-500"
                                style={{ height: `${Math.max(tePct, 3)}%` }}
                                title={`Gia sư nhận: ${formatCurrency(item.tutorEarning)}`}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 mt-1">
                              {formatMonthLabel(item.month)}
                            </span>
                          </div>
                        )
                      })
                    ) : revenue && revenue.totalOrders > 0 ? (
                      <>
                        <div className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-xs font-medium text-orange-600">
                            {formatCurrency(revenue.totalPlatformFee)}
                          </span>
                          <div
                            className="w-full max-w-[120px] rounded-t bg-orange-400 transition-all duration-500"
                            style={{ height: `${Math.max((revenue.totalPlatformFee / Math.max(revenue.totalTutorEarning, 1)) * 100, 4)}%` }}
                          />
                          <span className="text-xs font-semibold text-slate-600">Phí nền tảng</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-xs font-medium text-purple-600">
                            {formatCurrency(revenue.totalTutorEarning)}
                          </span>
                          <div
                            className="w-full max-w-[120px] rounded-t bg-purple-500 transition-all duration-500"
                            style={{ height: '100%' }}
                          />
                          <span className="text-xs font-semibold text-slate-600">Gia sư nhận</span>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-orange-400" /> Phí nền tảng (10%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-500" /> Gia sư nhận (90%)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              Chưa có dữ liệu doanh thu trong khoảng thời gian này
            </div>
          )}
        </div>

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
                      <td className="px-5 py-3 text-right text-green-600 font-medium">{formatCurrency(order.tutorEarning)}</td>
                      <td className="px-5 py-3 text-right text-slate-500">{formatDate(order.paidAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
      </div>
    </AccountLayout>
  )
}