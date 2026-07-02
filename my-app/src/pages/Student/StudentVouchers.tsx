import { useEffect, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { AccountPageContainer } from '../../components/AccountPageContainer'
import { AccountPageHeader } from '../../components/AccountPageHeader'
import { getAvailableVouchers, type VoucherResponse } from '../../api/voucher'

const SCOPE_LABELS: Record<string, string> = {
  PLATFORM: 'Toàn hệ thống',
  ALL_CLASSES: 'Tất cả lớp học',
  SPECIFIC_CLASS: 'Lớp cụ thể',
}

export default function StudentVouchers() {
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAvailableVouchers()
      .then((data) => {
        setVouchers(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatDiscount = (v: VoucherResponse) => {
    if (v.discountType === 'PERCENT') {
      return `${v.discountValue}%`
    }
    return `${v.discountValue.toLocaleString('vi-VN')}₫`
  }

  const getStatusBadge = (v: VoucherResponse) => {
    if (!v.active) return { label: 'Không hoạt động', className: 'bg-gray-100 text-gray-500' }

    const now = new Date()
    if (v.endDate && new Date(v.endDate) < now) {
      return { label: 'Hết hạn', className: 'bg-red-100 text-red-500' }
    }
    if (v.startDate && new Date(v.startDate) > now) {
      return { label: 'Sắp diễn ra', className: 'bg-yellow-100 text-yellow-600' }
    }
    if (v.usageLimit !== null && v.usedCount >= v.usageLimit) {
      return { label: 'Hết lượt', className: 'bg-red-100 text-red-500' }
    }
    return { label: 'Khả dụng', className: 'bg-green-100 text-green-600' }
  }

  return (
    <AccountLayout activePath="/student/vouchers">
      <div className="min-h-screen bg-[#f0f2f5] w-full text-left pb-12">
        <AccountPageContainer>
          <AccountPageHeader title="Mã giảm giá của tôi" />
          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
              <div className="text-5xl mb-4">🎫</div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Bạn chưa có mã giảm giá nào
              </h3>
              <p className="text-slate-500">
                Các mã giảm giá khả dụng sẽ hiển thị tại đây
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.map((voucher) => {
                const badge = getStatusBadge(voucher)
                return (
                  <div
                    key={voucher.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Top section */}
                    <div className="p-5 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                            {SCOPE_LABELS[voucher.applicableScope] || voucher.applicableScope}
                          </span>
                        </div>
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4267b2] to-[#00a859] flex items-center justify-center text-white font-bold text-lg shrink-0">
                          <i className="fa-solid fa-tag text-xl"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 tracking-wide">
                            {voucher.code}
                          </h3>
                          <p className="text-2xl font-bold text-[#00a859]">
                            {formatDiscount(voucher)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 mt-3">
                        {voucher.minPrice && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <i className="fa-solid fa-coins text-xs w-4"></i>
                            <span>Đơn tối thiểu: <strong>{voucher.minPrice.toLocaleString('vi-VN')}₫</strong></span>
                          </div>
                        )}
                        {voucher.maxDiscount && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <i className="fa-solid fa-hand-holding-dollar text-xs w-4"></i>
                            <span>Giảm tối đa: <strong>{voucher.maxDiscount.toLocaleString('vi-VN')}₫</strong></span>
                          </div>
                        )}
                        {voucher.tutorName && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <i className="fa-solid fa-chalkboard-user text-xs w-4"></i>
                            <span>Gia sư: <strong>{voucher.tutorName}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom section */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        {voucher.startDate && (
                          <span>
                            <i className="fa-regular fa-calendar mr-1"></i>
                            BĐ: {new Date(voucher.startDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {voucher.endDate && (
                          <span>
                            <i className="fa-regular fa-clock mr-1"></i>
                            HH: {new Date(voucher.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {voucher.usageLimit && (
                          <span>
                            <i className="fa-solid fa-ticket mr-1"></i>
                            {voucher.usedCount}/{voucher.usageLimit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </AccountPageContainer>
      </div>
    </AccountLayout>
  )
}
