import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import {
  createAdminUser,
  getCurrentAdmin,
  uploadAdminUserAvatar,
  type AdminCreateUserPayload,
  type AdminSession,
  type AdminUserRole,
} from '../../api/admin'
import { AdminLayout } from '../../components/AdminLayout'

type FormState = {
  fullName: string
  email: string
  password: string
  role: AdminUserRole
  enabled: boolean
  phone: string
  avatar: string
  workLocation: string
  sendWelcomeEmail: boolean
}

const initialForm: FormState = {
  fullName: '',
  email: '',
  password: '',
  role: 'STUDENT',
  enabled: true,
  phone: '',
  avatar: '',
  workLocation: '',
  sendWelcomeEmail: true,
}

export function AdminCreateUser() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState<FormState>(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
    if (!avatarFile) {
      setAvatarPreview('')
      return
    }

    const previewUrl = URL.createObjectURL(avatarFile)
    setAvatarPreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [avatarFile])

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh hợp lệ.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Ảnh đại diện không được vượt quá 2MB.')
      event.target.value = ''
      return
    }

    setError('')
    setAvatarFile(file)
    updateField('avatar', '')
  }

  const clearAvatarFile = () => {
    setAvatarFile(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Vui lòng nhập đầy đủ họ tên, email và mật khẩu.')
      return
    }

    if (form.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }

    const payload: AdminCreateUserPayload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      enabled: form.enabled,
      phone: form.phone.trim() || undefined,
      avatar: avatarFile ? undefined : form.avatar.trim() || undefined,
      sendWelcomeEmail: form.sendWelcomeEmail,
    }

    setSaving(true)
    try {
      const createdUser = await createAdminUser(payload)

      if (avatarFile) {
        try {
          await uploadAdminUserAvatar(createdUser.id, avatarFile)
        } catch {
          window.alert('Người dùng đã được tạo, nhưng tải ảnh đại diện chưa thành công.')
        }
      }

      window.location.href = '/admin/users'
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: string } }).response?.data
          : ''
      setError(message || 'Không thể tạo người dùng mới. Vui lòng thử lại.')
    } finally {
      setSaving(false)
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
      <form id="admin-create-user-form" onSubmit={handleSubmit} className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <a
              href="/admin/users"
              className="mb-3 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
            >
              <ArrowLeftIcon /> Quay lại
            </a>
            <div role="heading" aria-level={1} className="flex h-10 items-center text-base font-bold tracking-normal text-slate-950">Tạo Người dùng Mới</div>
            <p className="mt-1 text-sm text-slate-600">
              Thiết lập hồ sơ người dùng mới trong hệ thống EduMatch Pro.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/admin/users"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy bỏ
            </a>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
            <Card title="Ảnh đại diện">
              <div className="flex flex-col items-center">
                <label
                  htmlFor="avatar-file"
                  className="group relative mb-4 flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 transition hover:border-blue-500 hover:bg-blue-50"
                  title="Chọn ảnh đại diện"
                >
                  {avatarPreview || form.avatar ? (
                    <img src={avatarPreview || form.avatar} alt="Ảnh đại diện" className="h-full w-full object-cover" />
                  ) : (
                    <CameraIcon className="h-9 w-9 text-slate-400" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-blue-700/70 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                    Chọn ảnh
                  </span>
                </label>
                <input
                  id="avatar-file"
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleAvatarChange}
                />
                {avatarFile ? (
                  <div className="mb-3 flex max-w-full items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                    <span className="truncate">{avatarFile.name}</span>
                    <button
                      type="button"
                      onClick={clearAvatarFile}
                      className="shrink-0 rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </button>
                  </div>
                ) : null}
                <label className="mb-2 block w-full text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="avatar">
                  Hoặc nhập đường dẫn ảnh
                </label>
                <input
                  id="avatar"
                  value={form.avatar}
                  onChange={(event) => {
                    updateField('avatar', event.target.value)
                    setAvatarFile(null)
                  }}
                  className={inputClass}
                  placeholder="https://..."
                  type="url"
                />
                <p className="mt-3 text-center text-sm leading-6 text-slate-500">
                  Bấm vào vòng ảnh để chọn file JPG, PNG, GIF hoặc WebP. Kích thước tối đa 2MB.
                </p>
              </div>
            </Card>

            <Card title="Trạng thái tài khoản">
              <div className="space-y-3">
                <StatusOption
                  checked={form.enabled}
                  title="Hoạt động"
                  description="Người dùng có thể đăng nhập và sử dụng hệ thống."
                  onChange={() => updateField('enabled', true)}
                />
                <StatusOption
                  checked={!form.enabled}
                  title="Bị khóa"
                  description="Tài khoản được tạo nhưng tạm thời chưa thể truy cập."
                  onChange={() => updateField('enabled', false)}
                />
              </div>
            </Card>
          </div>

          <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
            <Card title="Thông tin cá nhân">
              <div className="grid grid-cols-2 gap-5">
                <Field label="Họ và tên" className="col-span-2">
                  <input
                    value={form.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                    className={inputClass}
                    placeholder="Nhập tên đầy đủ"
                    type="text"
                    autoComplete="name"
                  />
                </Field>

                <Field label="Địa chỉ Email" className="col-span-2 md:col-span-1">
                  <input
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    className={inputClass}
                    placeholder="example@edumatch.vn"
                    type="email"
                    autoComplete="email"
                  />
                </Field>

                <Field label="Vai trò" className="col-span-2 md:col-span-1">
                  <select
                    value={form.role}
                    onChange={(event) => updateField('role', event.target.value as AdminUserRole)}
                    className={inputClass}
                  >
                    <option value="STUDENT">Học viên (Student)</option>
                    <option value="TUTOR">Gia sư (Tutor)</option>
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                  </select>
                </Field>

                <Field label="Mật khẩu" className="col-span-2">
                  <div className="relative">
                    <input
                      value={form.password}
                      onChange={(event) => updateField('password', event.target.value)}
                      className={`${inputClass} pr-11`}
                      placeholder="Tối thiểu 8 ký tự"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Sử dụng ít nhất 8 ký tự, nên bao gồm chữ cái và số.
                  </p>
                </Field>
              </div>
            </Card>

            <Card title="Thông tin bổ sung">
              <div className="grid grid-cols-2 gap-5">
                <Field label="Số điện thoại" className="col-span-2 md:col-span-1">
                  <input
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    className={inputClass}
                    placeholder="+84 ..."
                    type="tel"
                    autoComplete="tel"
                  />
                </Field>

                <Field label="Vị trí công tác" className="col-span-2 md:col-span-1">
                  <input
                    value={form.workLocation}
                    onChange={(event) => updateField('workLocation', event.target.value)}
                    className={inputClass}
                    placeholder="Ví dụ: Hà Nội, VN"
                    type="text"
                  />
                </Field>
              </div>
            </Card>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-center gap-3 text-blue-900">
                <MailIcon className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Gửi email chào mừng</p>
                  <p className="text-sm text-blue-800/80">
                    Lưu tùy chọn gửi thông tin đăng nhập và hướng dẫn cho người dùng này.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  checked={form.sendWelcomeEmail}
                  onChange={(event) => updateField('sendWelcomeEmail', event.target.checked)}
                  className="peer sr-only"
                  type="checkbox"
                />
                <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-700" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </label>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}

const inputClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{title}</h2>
      {children}
    </section>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-bold text-slate-900">{label}</span>
      {children}
    </label>
  )
}

function StatusOption({
  checked,
  title,
  description,
  onChange,
}: {
  checked: boolean
  title: string
  description: string
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
      <input
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-slate-300 text-blue-700 focus:ring-blue-500"
        name="status"
        type="radio"
      />
      <span>
        <span className="block text-sm font-bold text-slate-950">{title}</span>
        <span className="mt-0.5 block text-sm text-slate-500">{description}</span>
      </span>
    </label>
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

function ArrowLeftIcon() {
  return <Svg className="h-4 w-4"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></Svg>
}

function CameraIcon({ className }: { className?: string }) {
  return <Svg className={className}><path d="M14.5 4h-5L8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-1.5-3Z" /><circle cx="12" cy="13" r="3" /></Svg>
}

function EyeIcon() {
  return <Svg className="h-5 w-5"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Svg>
}

function EyeOffIcon() {
  return <Svg className="h-5 w-5"><path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a13.3 13.3 0 0 1-3 3.9" /><path d="M6.1 6.8C3.5 8.5 2 12 2 12s3.5 7 10 7a10.3 10.3 0 0 0 4.1-.8" /></Svg>
}

function MailIcon({ className }: { className?: string }) {
  return <Svg className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
}
