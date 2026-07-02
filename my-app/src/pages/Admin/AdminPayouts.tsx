import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { getCurrentAdmin, type AdminSession } from '../../api/admin'
import {
  approvePayout,
  getAllPayouts,
  rejectPayout,
  type AdminPayoutItem,
} from '../../api/payout'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
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
    PENDING: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
    COMPLETED: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
    FAILED: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
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

function getPaymentMethodLabel(method: string | null) {
  if (method === 'vnpay_transfer') return 'VNPay'
  if (method === 'bank_transfer') return 'Chuyển khoản'
  return '-'
}

export function AdminPayouts() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [payouts, setPayouts] = useState<AdminPayoutItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: number; tutorName: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [transferModal, setTransferModal] = useState<AdminPayoutItem | null>(null)
  const [transferMethod, setTransferMethod] = useState<'vnpay_transfer' | 'bank_transfer'>('vnpay_transfer')
  const [transferTransactionId, setTransferTransactionId] = useState('')
  const [transferNote, setTransferNote] = useState('')

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
    } catch (err) {
      console.error('Failed to load payouts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!checking) loadPayouts()
  }, [statusFilter, checking])

  const openTransferModal = (payout: AdminPayoutItem) => {
    setTransferModal(payout)
    setTransferMethod('vnpay_transfer')
    setTransferTransactionId('')
    setTransferNote('')
  }

  const closeTransferModal = () => {
    setTransferModal(null)
    setTransferTransactionId('')
    setTransferNote('')
  }

  const handleApprove = async () => {
    if (!transferModal) return
    if (transferMethod === 'vnpay_transfer' && !transferTransactionId.trim()) {
      alert('Vui lòng nhập mã giao dịch VNPay sau khi đã chuyển tiền.')
      return
    }

    try {
      setActionLoading(transferModal.id)
      await approvePayout(transferModal.id, {
        paymentMethod: transferMethod,
        providerTransactionId: transferTransactionId.trim() || undefined,
        note: transferNote.trim() || undefined,
        providerNote:
          transferMethod === 'vnpay_transfer'
            ? 'Admin xác nhận đã chuyển tiền qua VNPay/Internet Banking'
            : 'Admin xác nhận đã chuyển khoản ngân hàng',
      })
      closeTransferModal()
      loadPayouts()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thanh toán.')
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
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi từ chối yêu cầu.')
    } finally {
      setActionLoading(null)
    }
  }

  const totalPending = payouts.filter((p) => p.status === 'PENDING').length
  const totalAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0)
  const completedAmount = payouts
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, payout) => sum + payout.amount, 0)

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-sm font-semibold text-slate-600">
        Đang kiểm tra quyền quản trị...
      </div>
    )
  }

  return (
    <AdminLayout activePath="/admin/payouts" adminName={admin?.fullName}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <h1 className="m-0 text-2xl font-bold text-blue-900">Quản lý thanh toán cho gia sư</h1>
        <div className="flex flex-wrap gap-2">
          {['', 'PENDING', 'COMPLETED', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`inline-flex h-9 items-center rounded border px-4 text-xs font-bold shadow-sm transition-colors ${
                statusFilter === status
                  ? 'border-blue-700 bg-blue-700 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {status === '' ? 'Tất cả' : status === 'PENDING' ? 'Chờ duyệt' : status === 'COMPLETED' ? 'Đã thanh toán' : 'Từ chối'}
            </button>
          ))}
        </div>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng yêu cầu" value={String(payouts.length)} helper="Tất cả yêu cầu rút tiền" />
        <StatCard title="Chờ duyệt" value={String(totalPending)} helper="Yêu cầu chưa xử lý" tone="text-amber-600" />
        <StatCard title="Tổng tiền yêu cầu" value={formatCurrency(totalAmount)} helper="Tổng số tiền các yêu cầu" tone="text-blue-700" />
        <StatCard title="Đã thanh toán" value={formatCurrency(completedAmount)} helper="Đã chuyển cho gia sư" tone="text-emerald-600" />
      </section>

      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-blue-50">
                <TableHead>Mã</TableHead>
                <TableHead>Gia sư</TableHead>
                <TableHead align="right">Số tiền</TableHead>
                <TableHead>Ngân hàng</TableHead>
                <TableHead>Số TK</TableHead>
                <TableHead>Chủ TK</TableHead>
                <TableHead>Giao dịch</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead align="right">Ngày tạo</TableHead>
                <TableHead align="center">Thao tác</TableHead>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                    Không có yêu cầu nào
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-500">#{payout.id}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900">{payout.tutorName}</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-slate-900">{formatCurrency(payout.amount)}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{payout.bankName || '-'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{payout.bankAccount || '-'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{payout.bankHolder || '-'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      <div className="font-semibold text-slate-800">{getPaymentMethodLabel(payout.paymentMethod)}</div>
                      {payout.providerTransactionId && (
                        <div className="mt-0.5 font-mono text-xs text-blue-700">{payout.providerTransactionId}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">{getStatusBadge(payout.status)}</td>
                    <td className="max-w-[170px] truncate px-5 py-3 text-sm text-slate-500">{payout.note || '-'}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-500">{formatDate(payout.createdAt)}</td>
                    <td className="px-5 py-3 text-center">
                      {payout.status === 'PENDING' && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openTransferModal(payout)}
                            disabled={actionLoading === payout.id}
                            className="inline-flex h-8 items-center rounded bg-blue-700 px-3 text-xs font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Chuyển tiền
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: payout.id, tutorName: payout.tutorName })}
                            disabled={actionLoading === payout.id}
                            className="inline-flex h-8 items-center rounded bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
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

      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Xác nhận chuyển tiền</h2>
            <p className="mt-1 text-sm text-slate-600">
              Gia sư <strong>{transferModal.tutorName}</strong> yêu cầu rút <strong>{formatCurrency(transferModal.amount)}</strong>.
            </p>

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              VNPay trong hệ thống hiện dùng cho thanh toán vào nền tảng. Với rút tiền, admin chuyển tiền ngoài hệ thống rồi nhập mã giao dịch để ghi nhận và khóa các khoản đã payout.
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Phương thức chuyển</label>
                <select
                  value={transferMethod}
                  onChange={(event) => setTransferMethod(event.target.value as 'vnpay_transfer' | 'bank_transfer')}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="vnpay_transfer">VNPay / Internet Banking</option>
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Mã giao dịch {transferMethod === 'vnpay_transfer' ? '*' : ''}
                </label>
                <input
                  value={transferTransactionId}
                  onChange={(event) => setTransferTransactionId(event.target.value)}
                  placeholder="Ví dụ: VNP123456789"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Ghi chú nội bộ</label>
                <textarea
                  value={transferNote}
                  onChange={(event) => setTransferNote(event.target.value)}
                  placeholder="Nhập ghi chú khi cần..."
                  rows={3}
                  className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeTransferModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading === transferModal.id}
                className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === transferModal.id ? 'Đang xử lý...' : 'Xác nhận đã chuyển'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows={3}
                className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectModal(null)
                  setRejectReason('')
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
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

function StatCard({ title, value, helper, tone = 'text-slate-950' }: { title: string; value: string; helper: string; tone?: string }) {
  return (
    <article className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-800">{title}</p>
      <p className={`mt-1.5 text-2xl font-bold ${tone}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-600">{helper}</p>
    </article>
  )
}

function TableHead({
  children,
  align = 'left',
}: {
  children: ReactNode
  align?: 'left' | 'right' | 'center'
}) {
  const alignment = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <th className={`px-5 py-3 text-xs font-bold uppercase tracking-wider text-blue-900 ${alignment}`}>
      {children}
    </th>
  )
}
