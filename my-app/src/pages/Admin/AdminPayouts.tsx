import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { getCurrentAdmin, type AdminSession } from '../../api/admin'
import {
  getAllPayouts,
  approvePayout,
  rejectPayout,
  type AdminPayoutItem,
} from '../../api/payout'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  )
}

export function AdminPayouts() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [payouts, setPayouts] = useState<AdminPayoutItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: number; tutorName: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    getCurrentAdmin(token)
      .then(setAdmin)
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      })
      .finally(() => setChecking(false))
  }, [])

  const loadPayouts = async () => {
    try {
      setLoading(true)
      const data = await getAllPayouts(statusFilter || undefined)
      setPayouts(data)
    } catch (err: any) {
      console.error('Failed to load payouts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!checking) loadPayouts()
  }, [statusFilter, checking])

  const handleApprove = async (payoutId: number) => {
    if (!window.confirm('Xác nhận đã chuyển tiền cho gia sư này?')) return
    try {
      setActionLoading(payoutId)
      await approvePayout(payoutId)
      loadPayouts()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    try {
      setActionLoading(rejectModal.id)
      await rejectPayout(rejectModal.id, rejectReason || 'Yêu cầu bị từ chối bởi admin')
      setRejectModal(null)
      setRejectReason('')
      loadPayouts()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setActionLoading(null)
    }
  }

  const totalPending = payouts.filter(p => p.status === 'PENDING').length
  const totalAmount = payouts.reduce((s, p) => s + p.amount, 0)

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-sm font-semibold text-slate-600">
        Đang kiểm tra quyền quản trị...
      </div>
    )
  }

  return (
    <AdminLayout activePath="/admin/payouts" adminName={admin?.fullName}>
      <div className="mb-5 flex items-start justify-between gap-5">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Quản lý thanh toán cho gia sư</h1>
        </div>
        <div className="flex gap-2">
          {['', 'PENDING', 'COMPLETED', 'FAILED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`inline-flex h-9 items-center gap-2 rounded border px-4 text-xs font-bold shadow-sm transition-colors ${
                statusFilter === s
                  ? 'border-blue-700 bg-blue-700 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {s === '' ? 'Tất cả' : s === 'PENDING' ? `Chờ duyệt` : s === 'COMPLETED' ? 'Đã duyệt' : 'Từ chối'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <section className="mb-5 grid grid-cols-4 gap-4">
        <article className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800">Tổng yêu cầu</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-950">{payouts.length}</p>
          <p className="mt-2 text-xs text-slate-600">Tất cả yêu cầu rút tiền</p>
        </article>
        <article className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800">Chờ duyệt</p>
          <p className="mt-1.5 text-2xl font-bold text-yellow-600">{totalPending}</p>
          <p className="mt-2 text-xs text-slate-600">Yêu cầu chưa xử lý</p>
        </article>
        <article className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800">Tổng tiền yêu cầu</p>
          <p className="mt-1.5 text-2xl font-bold text-blue-700">{formatCurrency(totalAmount)}</p>
          <p className="mt-2 text-xs text-slate-600">Tổng số tiền các yêu cầu</p>
        </article>
        <article className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800">Đã thanh toán</p>
          <p className="mt-1.5 text-2xl font-bold text-green-600">
            {formatCurrency(payouts.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0))}
          </p>
          <p className="mt-2 text-xs text-slate-600">Đã chuyển cho gia sư</p>
        </article>
      </section>

      {/* Table */}
      <div className="rounded-lg border border-slate-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Mã</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Gia sư</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Số tiền</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Ngân hàng</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Số TK</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Chủ TK</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Trạng thái</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Ghi chú</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Ngày tạo</th>
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                    Không có yêu cầu nào
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-500">#{p.id}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900">{p.tutorName}</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{p.bankName || '—'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{p.bankAccount || '—'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{p.bankHolder || '—'}</td>
                    <td className="px-5 py-3">{getStatusBadge(p.status)}</td>
                    <td className="max-w-[150px] truncate px-5 py-3 text-sm text-slate-500">{p.note || '—'}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-500">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-3 text-center">
                      {p.status === 'PENDING' && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApprove(p.id)}
                            disabled={actionLoading === p.id}
                            className="inline-flex h-7 items-center rounded bg-green-600 px-2.5 text-xs font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionLoading === p.id ? '...' : 'Duyệt'}
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: p.id, tutorName: p.tutorName })}
                            disabled={actionLoading === p.id}
                            className="inline-flex h-7 items-center rounded bg-red-600 px-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Từ chối yêu cầu</h2>
            <p className="mt-1 text-sm text-slate-500">
              Gia sư: <strong>{rejectModal.tutorName}</strong>
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Lý do từ chối</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows={3}
                className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === rejectModal.id ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}