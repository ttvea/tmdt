import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  getAdminUsers,
  getAdminUsersStats,
  getCurrentAdmin,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminSession,
  type AdminUser,
  type AdminUserRole,
  type AdminUsersStats,
} from '../../api/admin'
import { AdminLayout } from '../../components/AdminLayout'

const PAGE_SIZE = 10

const emptyStats: AdminUsersStats = {
  totalUsers: 0,
  totalStudents: 0,
  totalTutors: 0,
  totalAdmins: 0,
  activeUsers: 0,
  lockedUsers: 0,
  newUsersThisWeek: 0,
}

const roleLabels: Record<AdminUserRole, string> = {
  STUDENT: 'Học sinh',
  TUTOR: 'Gia sư',
  ADMIN: 'Admin',
}

export function AdminUsers() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminUsersStats>(emptyStats)
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [role, setRole] = useState<AdminUserRole | ''>('')
  const [enabled, setEnabled] = useState<boolean | ''>('')
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<AdminUserRole>('STUDENT')

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
  }, [keyword, role, enabled])

  useEffect(() => {
    if (checking) return

    setLoading(true)
    Promise.all([
      getAdminUsers({ keyword: keyword.trim() || undefined, role, enabled, page, size: PAGE_SIZE }),
      getAdminUsersStats().catch(() => emptyStats),
    ])
      .then(([usersPage, statsData]) => {
        setUsers(usersPage.content)
        setTotalElements(usersPage.totalElements)
        setTotalPages(Math.max(1, usersPage.totalPages))
        setStats(statsData)
      })
      .catch(() => {
        setUsers([])
        setTotalElements(0)
        setTotalPages(1)
      })
      .finally(() => setLoading(false))
  }, [checking, enabled, keyword, page, role])

  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements)

  const statsCards = useMemo(
    () => [
      {
        label: 'Tổng người dùng',
        value: stats.totalUsers,
        badge: `+${stats.newUsersThisWeek} tuần này`,
        badgeClass: 'bg-green-50 text-green-700',
      },
      {
        label: 'Gia sư',
        value: stats.totalTutors,
        badge: `${stats.totalStudents} học sinh`,
        badgeClass: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Tài khoản đã khóa',
        value: stats.lockedUsers,
        badge: stats.lockedUsers > 0 ? 'Cần xem xét' : 'Ổn định',
        badgeClass: stats.lockedUsers > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600',
      },
      {
        label: 'Đang hoạt động',
        value: stats.activeUsers,
        badge: `${stats.totalAdmins} admin`,
        badgeClass: 'bg-cyan-50 text-cyan-700',
      },
    ],
    [stats],
  )

  const handleToggleStatus = async (user: AdminUser) => {
    const nextEnabled = !(user.enabled ?? true)
    const actionLabel = nextEnabled ? 'mở khóa' : 'khóa'
    const confirmed = window.confirm(`Bạn có chắc muốn ${actionLabel} tài khoản ${user.fullName}?`)
    if (!confirmed) return

    setUpdatingId(user.id)
    try {
      const updated = await updateAdminUserStatus(user.id, nextEnabled)
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setStats((prev) => ({
        ...prev,
        activeUsers: prev.activeUsers + (nextEnabled ? 1 : -1),
        lockedUsers: prev.lockedUsers + (nextEnabled ? -1 : 1),
      }))
    } catch {
      alert('Không thể cập nhật trạng thái người dùng.')
    } finally {
      setUpdatingId(null)
    }
  }

  const openRoleEditor = (user: AdminUser) => {
    if (user.role === 'ADMIN') {
      alert('Không thể sửa quyền của tài khoản Admin.')
      return
    }

    setEditingUser(user)
    setSelectedRole(user.role ?? 'STUDENT')
  }

  const handleSaveRole = async () => {
    if (!editingUser) return

    setUpdatingId(editingUser.id)
    try {
      const updated = await updateAdminUserRole(editingUser.id, selectedRole)
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      getAdminUsersStats().then(setStats).catch(() => {})
      setEditingUser(null)
    } catch {
      alert('Không thể cập nhật vai trò người dùng.')
    } finally {
      setUpdatingId(null)
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
    <AdminLayout activePath="/admin/users" adminName={admin?.fullName}>
      <div className="mb-6 flex items-end justify-between gap-5">
        <div>
          <h1 className="m-0 text-3xl font-bold tracking-normal text-slate-950">Quản lý Người dùng</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-700">
            Quản lý thông tin đăng nhập, phân quyền và trạng thái bảo mật cho tất cả thành viên nền tảng EduMatch Pro.
          </p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-800">
          <PlusIcon /> Tạo Người dùng Mới
        </button>
      </div>

      <section className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="min-w-[240px] flex-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Tìm kiếm
          </label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Tìm theo tên, email hoặc số điện thoại"
              type="search"
            />
          </div>
        </div>

        <FilterSelect
          label="Vai trò"
          value={role}
          onChange={(value) => setRole(value as AdminUserRole | '')}
          options={[
            { label: 'Tất cả vai trò', value: '' },
            { label: 'Học sinh', value: 'STUDENT' },
            { label: 'Gia sư', value: 'TUTOR' },
            { label: 'Admin', value: 'ADMIN' },
          ]}
        />

        <FilterSelect
          label="Trạng thái"
          value={String(enabled)}
          onChange={(value) => {
            if (value === '') setEnabled('')
            else setEnabled(value === 'true')
          }}
          options={[
            { label: 'Tất cả trạng thái', value: '' },
            { label: 'Đang hoạt động', value: 'true' },
            { label: 'Đã khóa', value: 'false' },
          ]}
        />

        <div className="ml-auto self-end pb-2 text-sm font-semibold text-slate-500">
          Đang hiển thị {totalElements.toLocaleString('vi-VN')} người dùng
        </div>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        {statsCards.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <h3 className="text-3xl font-bold text-slate-950">{item.value.toLocaleString('vi-VN')}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.badgeClass}`}>
                {item.badge}
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">Tên / Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">Cập nhật</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                    Không có người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    updating={updatingId === user.id}
                    onView={() => setViewingUser(user)}
                    isCurrentAdmin={admin?.id === user.id}
                    onToggleStatus={() => handleToggleStatus(user)}
                    onChangeRole={() => openRoleEditor(user)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <span className="text-sm text-slate-600">
            Hiển thị từ {showingFrom} đến {showingTo} trong tổng số {totalElements.toLocaleString('vi-VN')} kết quả
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-3 text-xs font-bold text-blue-700">
              {page + 1} <span className="font-medium text-slate-500">/ {totalPages}</span>
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Tiếp
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl bg-blue-700 p-6 text-white shadow-sm">
          <div className="relative z-10">
            <h4 className="text-xl font-bold">Kiểm tra Bảo mật Người dùng</h4>
            <p className="mt-2 max-w-md text-sm leading-6 text-blue-50">
              Theo dõi tài khoản bị khóa và các trạng thái bất thường để giữ nền tảng vận hành ổn định.
            </p>
          </div>
          <ShieldIcon className="absolute -bottom-5 -right-5 h-28 w-28 rotate-12 text-white/10" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h4 className="text-xl font-bold text-slate-950">Tính toàn vẹn của nền tảng</h4>
          <div className="mt-5 space-y-3">
            <IntegrityRow
              label="Tài khoản hoạt động"
              value={stats.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}
            />
            <IntegrityRow
              label="Tài khoản đã xác minh"
              value={stats.totalUsers ? Math.round(((stats.totalUsers - stats.lockedUsers) / stats.totalUsers) * 100) : 0}
            />
          </div>
        </div>
      </section>

      {viewingUser ? <UserDetailModal user={viewingUser} onClose={() => setViewingUser(null)} /> : null}
      {editingUser ? (
        <RoleEditModal
          user={editingUser}
          selectedRole={selectedRole}
          updating={updatingId === editingUser.id}
          onRoleChange={setSelectedRole}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveRole}
        />
      ) : null}
    </AdminLayout>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div className="min-w-[170px]">
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function UserRow({
  user,
  updating,
  isCurrentAdmin,
  onView,
  onToggleStatus,
  onChangeRole,
}: {
  user: AdminUser
  updating: boolean
  isCurrentAdmin: boolean
  onView: () => void
  onToggleStatus: () => void
  onChangeRole: () => void
}) {
  const role = user.role ?? 'STUDENT'
  const enabled = user.enabled ?? true

  return (
    <tr className="transition hover:bg-slate-50">
      <td className="px-6 py-4 font-mono text-sm text-slate-500">#EDU-{user.id}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.fullName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
              {getInitials(user.fullName)}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-950">{user.fullName || 'Chưa cập nhật'}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wide ${getRoleClass(role)}`}>
          {roleLabels[role]}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-red-500'}`} />
          {enabled ? 'Hoạt động' : 'Đã khóa'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">{formatDateTime(user.updatedAt ?? user.createdAt)}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
            title="Xem chi tiết"
          >
            <EyeIcon />
          </button>
          <button
            type="button"
            onClick={onChangeRole}
            disabled={updating || role === 'ADMIN'}
            className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-500"
            title={role === 'ADMIN' ? 'Không thể sửa quyền Admin' : 'Sửa quyền'}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={updating || isCurrentAdmin}
            className={`rounded p-1.5 transition hover:bg-slate-100 disabled:opacity-50 ${
              enabled ? 'text-slate-500 hover:text-red-600' : 'text-red-600 hover:text-green-700'
            }`}
            title={isCurrentAdmin ? 'Không thể khóa tài khoản admin hiện tại' : enabled ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          >
            {enabled ? <UnlockIcon /> : <LockIcon />}
          </button>
        </div>
      </td>
    </tr>
  )
}

function UserDetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const role = user.role ?? 'STUDENT'
  const enabled = user.enabled ?? true

  return (
    <Modal title="Chi tiết người dùng" onClose={onClose}>
      <div className="flex items-start gap-4">
        {user.avatar ? (
          <img src={user.avatar} alt={user.fullName} className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-800">
            {getInitials(user.fullName)}
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-slate-950">{user.fullName || 'Chưa cập nhật'}</h3>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wide ${getRoleClass(role)}`}>
              {roleLabels[role]}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
              }`}
            >
              {enabled ? 'Hoạt động' : 'Đã khóa'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <DetailItem label="Mã người dùng" value={`#EDU-${user.id}`} />
        <DetailItem label="Số điện thoại" value={user.phone || 'Chưa cập nhật'} />
        <DetailItem label="Xác minh" value={user.verified ? 'Đã xác minh' : 'Chưa xác minh'} />
        <DetailItem label="Ngày tạo" value={formatDateTime(user.createdAt)} />
        <DetailItem label="Cập nhật gần nhất" value={formatDateTime(user.updatedAt ?? user.createdAt)} />
      </div>
    </Modal>
  )
}

function RoleEditModal({
  user,
  selectedRole,
  updating,
  onRoleChange,
  onClose,
  onSave,
}: {
  user: AdminUser
  selectedRole: AdminUserRole
  updating: boolean
  onRoleChange: (role: AdminUserRole) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <Modal title="Sửa quyền người dùng" onClose={onClose}>
      <p className="text-sm leading-6 text-slate-600">
        Cập nhật vai trò cho <span className="font-semibold text-slate-950">{user.fullName}</span>. Thay đổi này sẽ ảnh hưởng quyền truy cập của tài khoản.
      </p>

      <label className="mt-5 block text-sm font-bold text-slate-900" htmlFor="admin-user-role">
        Vai trò mới
      </label>
      <select
        id="admin-user-role"
        value={selectedRole}
        onChange={(event) => onRoleChange(event.target.value as AdminUserRole)}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="STUDENT">Học sinh</option>
        <option value="TUTOR">Gia sư</option>
        <option value="ADMIN">Admin</option>
      </select>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={updating}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </Modal>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <section className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function IntegrityRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-bold text-slate-950">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function getRoleClass(role: AdminUserRole) {
  if (role === 'TUTOR') return 'bg-blue-100 text-blue-700'
  if (role === 'ADMIN') return 'bg-slate-900 text-white'
  return 'bg-cyan-100 text-cyan-700'
}

function getInitials(name: string) {
  return (
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'ND'
  )
}

function formatDateTime(value: string | null) {
  if (!value) return 'Chưa có dữ liệu'
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
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

function SearchIcon({ className }: { className?: string }) { return <Svg className={className}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg> }
function PlusIcon() { return <Svg className="h-4 w-4"><path d="M12 5v14M5 12h14" /></Svg> }
function EyeIcon() { return <Svg><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Svg> }
function EditIcon() { return <Svg><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg> }
function LockIcon() { return <Svg><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg> }
function UnlockIcon() { return <Svg><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></Svg> }
function ShieldIcon({ className }: { className?: string }) { return <Svg className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></Svg> }
function CloseIcon() { return <Svg><path d="M18 6 6 18M6 6l12 12" /></Svg> }
