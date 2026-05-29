import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  getAdminTutors,
  getCurrentAdmin,
  updateAdminTutorVerification,
  type AdminSession,
  type AdminTutor,
} from '../../api/admin'
import { AdminLayout } from '../../components/AdminLayout'

const PAGE_SIZE = 10

export function AdminTutors() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [tutors, setTutors] = useState<AdminTutor[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [updatingTutorId, setUpdatingTutorId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

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

  useEffect(() => {
    setPage(0)
  }, [keyword])

  useEffect(() => {
    if (checking) return

    setLoading(true)
    getAdminTutors({
      keyword: keyword.trim() || undefined,
      page,
      size: PAGE_SIZE,
    })
      .then((data) => {
        setTutors(data.content)
        setTotalElements(data.totalElements ?? data.content.length)
        setTotalPages(Math.max(1, data.totalPages ?? 1))
      })
      .catch(() => {
        setTutors([])
        setTotalElements(0)
        setTotalPages(1)
      })
      .finally(() => setLoading(false))
  }, [checking, keyword, page])

  const handleVerifyTutor = async (tutor: AdminTutor, verified: boolean) => {
    setActionError('')
    setUpdatingTutorId(tutor.userId)

    try {
      const updated = await updateAdminTutorVerification(tutor.userId, verified)
      setTutors((current) => current.map((item) => (item.userId === updated.userId ? updated : item)))
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: string | { message?: string } } }).response?.data
          : null
      setActionError(
        typeof message === 'string'
          ? message
          : message?.message || 'Không thể cập nhật trạng thái duyệt hồ sơ gia sư.',
      )
    } finally {
      setUpdatingTutorId(null)
    }
  }

  const verifiedCount = tutors.filter((tutor) => tutor.isVerified).length
  const pendingCount = Math.max(totalElements - verifiedCount, 0)
  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements)

  const statCards = useMemo(
    () => [
      {
        label: 'Tổng gia sư',
        value: totalElements,
        icon: <GroupsIcon />,
        iconClass: 'bg-blue-100 text-blue-700',
        badge: 'Đang cập nhật',
        badgeClass: 'bg-slate-100 text-slate-600',
      },
      {
        label: 'Đã xác thực',
        value: verifiedCount,
        icon: <VerifiedIcon />,
        iconClass: 'bg-cyan-100 text-cyan-700',
        badge: `${totalElements ? Math.round((verifiedCount / totalElements) * 100) : 0}%`,
        badgeClass: 'bg-green-50 text-green-700',
      },
      {
        label: 'Chờ hoàn thiện',
        value: pendingCount,
        icon: <PendingIcon />,
        iconClass: 'bg-amber-100 text-amber-700',
        badge: 'Hồ sơ',
        badgeClass: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Đánh giá TB',
        value: 0,
        icon: <StarIcon />,
        iconClass: 'bg-slate-100 text-slate-700',
        badge: 'Chưa có dữ liệu',
        badgeClass: 'bg-slate-100 text-slate-600',
      },
    ],
    [pendingCount, totalElements, verifiedCount],
  )

  const pendingTutors = tutors.filter((tutor) => !tutor.isVerified).slice(0, 2)

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-sm font-semibold text-slate-600">
        Đang kiểm tra quyền quản trị...
      </div>
    )
  }

  return (
    <AdminLayout activePath="/admin/tutors" adminName={admin?.fullName}>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-5">
          <div>
            <div role="heading" aria-level={1} className="flex h-10 items-center text-base font-bold tracking-normal text-slate-950">
              Quản lý Gia sư
            </div>
            <p className="mt-1 text-sm text-slate-700">
              Xem, duyệt và quản lý danh sách gia sư trên hệ thống EduMatch Pro.
            </p>
          </div>
          <a
            href="/admin/users/new?role=TUTOR"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
          >
            <PlusIcon /> Thêm Gia sư mới
          </a>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.label} card={card} />
          ))}
        </section>

        {actionError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {actionError}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-950">Danh sách gia sư</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {totalElements.toLocaleString('vi-VN')} kết quả
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[260px]">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Tìm kiếm gia sư..."
                  type="search"
                />
              </div>
              <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <FilterIcon /> Lọc
              </button>
              <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
                <DownloadIcon /> Xuất CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <TableHead>ID</TableHead>
                  <TableHead>Gia sư</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Chuyên môn</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                      Đang tải danh sách gia sư...
                    </td>
                  </tr>
                ) : tutors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                      Không có gia sư phù hợp.
                    </td>
                  </tr>
                ) : (
                  tutors.map((tutor) => (
                    <TutorRow
                      key={tutor.id}
                      tutor={tutor}
                      updating={updatingTutorId === tutor.userId}
                      onVerify={(verified) => handleVerifyTutor(tutor, verified)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm text-slate-600">
              Hiển thị {showingFrom} - {showingTo} trong tổng số {totalElements.toLocaleString('vi-VN')} gia sư
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-2 text-xs font-bold text-blue-700">
                {page + 1} <span className="font-medium text-slate-500">/ {totalPages}</span>
              </span>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Tiếp
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950">Hồ sơ chờ duyệt mới nhất</h2>
            <button className="text-sm font-bold text-blue-700 hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-3">
            {pendingTutors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500">
                Chưa có hồ sơ chờ duyệt trong trang hiện tại.
              </div>
            ) : (
              pendingTutors.map((tutor) => (
                <PendingTutorCard
                  key={tutor.id}
                  tutor={tutor}
                  updating={updatingTutorId === tutor.userId}
                  onVerify={() => handleVerifyTutor(tutor, true)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}

function StatCard({
  card,
}: {
  card: {
    label: string
    value: number
    icon: ReactNode
    iconClass: string
    badge: string
    badgeClass: string
  }
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg [&_svg]:h-5 [&_svg]:w-5 ${card.iconClass}`}>
          {card.icon}
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${card.badgeClass}`}>{card.badge}</span>
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{card.label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{card.value.toLocaleString('vi-VN')}</p>
      </div>
    </article>
  )
}

function TutorRow({
  tutor,
  updating,
  onVerify,
}: {
  tutor: AdminTutor
  updating: boolean
  onVerify: (verified: boolean) => void
}) {
  const subjects = tutor.subjects?.length ? tutor.subjects.join(', ') : 'Chưa cập nhật'
  const status = !tutor.hasProfile ? 'Chưa có hồ sơ' : tutor.isVerified ? 'Đã xác thực' : 'Chờ duyệt'
  const statusClass = !tutor.hasProfile
    ? 'bg-slate-100 text-slate-700'
    : tutor.isVerified
      ? 'bg-green-100 text-green-800'
      : 'bg-amber-100 text-amber-800'
  const profileHref = tutor.userId ? `/tutor/${tutor.userId}` : '#'

  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-6 py-4 font-mono text-sm text-slate-500">#EM-{tutor.id}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {tutor.avatar ? (
            <img src={tutor.avatar} alt={tutor.fullName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
              {getInitials(tutor.fullName)}
            </div>
          )}
          <div>
            <p className="font-bold text-slate-950">{tutor.fullName || 'Chưa cập nhật'}</p>
            <p className="text-sm text-slate-500">{tutor.email || tutor.major || 'Chưa có email'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-700">{subjects}</td>
      <td className="px-6 py-4">
        <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
          {tutor.experience || 'Chưa cập nhật'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <StarIcon className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-bold text-slate-900">0.0</span>
          <span className="text-xs text-slate-500">(0)</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <a
            href={profileHref}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
            title="Xem chi tiết"
          >
            <EyeIcon />
          </a>
          <button
            type="button"
            onClick={() => onVerify(!tutor.isVerified)}
            disabled={updating || !tutor.hasProfile}
            className={`rounded-full p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
              tutor.isVerified
                ? 'text-amber-600 hover:bg-amber-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={!tutor.hasProfile ? 'Gia sư chưa upload hồ sơ' : tutor.isVerified ? 'Hủy duyệt hồ sơ' : 'Duyệt hồ sơ'}
          >
            {tutor.isVerified ? <UnverifyIcon /> : <VerifyIcon />}
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-red-400 transition hover:bg-red-50"
            title="Xóa đang phát triển"
          >
            <DeleteIcon />
          </button>
        </div>
      </td>
    </tr>
  )
}

function PendingTutorCard({
  tutor,
  updating,
  onVerify,
}: {
  tutor: AdminTutor
  updating: boolean
  onVerify: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {getInitials(tutor.fullName)}
        </div>
        <div>
          <p className="font-bold text-slate-950">{tutor.fullName || 'Chưa cập nhật'}</p>
          <p className="text-sm text-slate-500">
            Môn: {tutor.subjects?.[0] || 'Chưa cập nhật'} • {tutor.experience || 'Chưa có kinh nghiệm'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onVerify}
          disabled={updating || !tutor.hasProfile}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updating ? 'Đang duyệt...' : tutor.hasProfile ? 'Duyệt' : 'Chưa có hồ sơ'}
        </button>
        <a href={tutor.userId ? `/tutor/${tutor.userId}` : '#'} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
          Chi tiết
        </a>
      </div>
    </div>
  )
}

function TableHead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 ${className}`}>{children}</th>
}

function getInitials(name: string) {
  return (
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'GS'
  )
}

function Svg({
  children,
  className = 'h-5 w-5',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      {children}
    </svg>
  )
}

function GroupsIcon() { return <Svg><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Svg> }
function VerifiedIcon() { return <Svg><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></Svg> }
function PendingIcon() { return <Svg><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Svg> }
function StarIcon({ className }: { className?: string }) { return <Svg className={className}><path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z" /></Svg> }
function PlusIcon() { return <Svg className="h-4 w-4"><path d="M12 5v14M5 12h14" /></Svg> }
function SearchIcon({ className }: { className?: string }) { return <Svg className={className}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg> }
function FilterIcon() { return <Svg className="h-4 w-4"><path d="M3 5h18M6 12h12M10 19h4" /></Svg> }
function DownloadIcon() { return <Svg className="h-4 w-4"><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></Svg> }
function EyeIcon() { return <Svg><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Svg> }
function VerifyIcon() { return <Svg><path d="m20 6-11 11-5-5" /></Svg> }
function UnverifyIcon() { return <Svg><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></Svg> }
function DeleteIcon() { return <Svg><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></Svg> }
