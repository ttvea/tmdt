import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  getAdminRefunds,
  createRefund,
  completeRefund,
  type RefundResponse,
  REFUND_STATUS_LABELS,
  REFUND_REASON_LABELS,
} from '../../api/refund'
import { AdminLayout } from '../../components/AdminLayout'

export function AdminRefunds() {
  const [refunds, setRefunds] = useState<RefundResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    orderId: '',
    amount: '',
    reason: 'QUALITY',
    disputeId: '',
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadRefunds()
  }, [statusFilter])

  async function loadRefunds() {
    setLoading(true)
    try {
      const data = await getAdminRefunds(statusFilter || undefined)
      setRefunds(data)
    } catch {
      toast.error('Không thể tải danh sách hoàn tiền.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    const orderId = parseInt(createForm.orderId)
    const amount = parseFloat(createForm.amount)
    if (!orderId || !amount || amount <= 0) {
      toast.error('Vui lòng nhập đầy đủ thông tin.')
      return
    }
    setCreating(true)
    try {
      await createRefund({
        orderId,
        amount,
        reason: createForm.reason,
        disputeId: createForm.disputeId ? parseInt(createForm.disputeId) : null,
      })
      toast.success('Đã tạo yêu cầu hoàn tiền.')
      setShowCreate(false)
      setCreateForm({ orderId: '', amount: '', reason: 'QUALITY', disputeId: '' })
      loadRefunds()
    } catch {
      toast.error('Không thể tạo hoàn tiền.')
    } finally {
      setCreating(false)
    }
  }

  async function handleComplete(refundId: number) {
    if (!window.confirm('Xác nhận đã hoàn tiền cho học viên?')) return
    try {
      await completeRefund(refundId)
      toast.success('Đã xác nhận hoàn tiền thành công!')
      loadRefunds()
    } catch {
      toast.error('Không thể xác nhận hoàn tiền.')
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING_REFUND: 'bg-amber-100 text-amber-800',
      TUTOR_PAID: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
    }
    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
        {REFUND_STATUS_LABELS[status] || status}
      </span>
    )
  }

  const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`
  const formatDate = (date: string | null) => date ? new Date(date).toLocaleString('vi-VN') : '—'

  return (
    <AdminLayout activePath="/admin/refunds">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Hoàn tiền</h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý quy trình hoàn tiền cho học viên</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING_REFUND">Chờ tutor thanh toán</option>
              <option value="TUTOR_PAID">Tutor đã thanh toán</option>
              <option value="COMPLETED">Đã hoàn tiền</option>
            </select>
            <button
              onClick={() => setShowCreate(true)}
              className="h-11 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-800"
            >
              + Tạo hoàn tiền
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead className="border-b border-slate-300 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-700">#</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-700">Order</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-700">Số tiền</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-700">Lý do</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-700">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-700">Tutor thanh toán</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-700">Hoàn tất</th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wide text-slate-700 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {refunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-blue-700">#{refund.id}</td>
                    <td className="px-6 py-4">
                      <a href={`/admin/orders/${refund.orderId}`} className="font-mono text-sm font-semibold text-blue-700 hover:underline">
                        #{refund.orderId}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(refund.amount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{REFUND_REASON_LABELS[refund.reason] || refund.reason}</td>
                    <td className="px-6 py-4">{statusBadge(refund.status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(refund.tutorPaidAt)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(refund.completedAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {refund.status === 'PENDING_REFUND' && (
                          <span className="text-xs text-amber-600 font-semibold">Chờ tutor thanh toán</span>
                        )}
                        {refund.status === 'TUTOR_PAID' && (
                          <button
                            onClick={() => handleComplete(refund.id)}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                            title="Xác nhận hoàn tiền"
                          >
                            Xác nhận
                          </button>
                        )}
                        {refund.status === 'COMPLETED' && (
                          <span className="text-xs text-green-600 font-semibold">Đã hoàn tất</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && refunds.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                      Chưa có yêu cầu hoàn tiền nào.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                      Đang tải...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Refund Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Tạo yêu cầu hoàn tiền</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Mã hóa đơn (Order ID)</label>
                <input
                  type="number"
                  value={createForm.orderId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, orderId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="VD: 123"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Số tiền hoàn (VND)</label>
                <input
                  type="number"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="VD: 1000000"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Lý do</label>
                <select
                  value={createForm.reason}
                  onChange={(e) => setCreateForm((f) => ({ ...f, reason: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {Object.entries(REFUND_REASON_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Mã Tranh chấp (nếu có)</label>
                <input
                  type="number"
                  value={createForm.disputeId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, disputeId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="VD: 45 (không bắt buộc)"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {creating ? 'Đang tạo...' : 'Tạo hoàn tiền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}