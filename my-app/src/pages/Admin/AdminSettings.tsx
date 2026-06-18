import { useEffect, useState, type ReactNode } from 'react'
import {
  getAdminSettings,
  getCurrentAdmin,
  updateAdminApprovalSettings,
  updateAdminPlatformSettings,
  updateAdminProfileSettings,
  updateAdminSupportDisputeSettings,
  uploadAdminSettingsAsset,
  uploadAdminUserAvatar,
  type AdminApprovalSettings,
  type AdminPlatformSettings,
  type AdminProfileSettings,
  type AdminSession,
  type AdminSettings as AdminSettingsData,
  type AdminSupportDisputeSettings,
} from '../../api/admin'
import { AdminLayout } from '../../components/AdminLayout'

const emptySettings: AdminSettingsData = {
  profile: {
    fullName: '',
    email: '',
    phone: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
  },
  platform: {
    siteName: '',
    brandName: '',
    logoUrl: '',
    faviconUrl: '',
    hotline: '',
    supportEmail: '',
    officeAddress: '',
    workingHours: '',
    zaloUrl: '',
    messengerUrl: '',
    facebookUrl: '',
  },
  approval: {
    requireTutorVerification: true,
    tutorMustBeVerifiedToOpenClass: true,
    requiredTutorDocuments: '',
    tutorApprovedMessage: '',
    tutorRejectedMessage: '',
    requireClassApproval: true,
    maxClassesForUnverifiedTutor: 0,
    autoCloseClassAfterDays: 30,
  },
  supportDisputes: {
    supportSlaHours: 24,
    supportCategories: '',
    disputeReasons: '',
    evidenceDeadlineHours: 48,
    defaultRefundPolicy: '',
    needEvidenceMessage: '',
    disputeResolvedMessage: '',
  },
}

type SaveSection = 'profile' | 'platform' | 'approval' | 'supportDisputes'

export function AdminSettings() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [settings, setSettings] = useState<AdminSettingsData>(emptySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<SaveSection | ''>('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      window.location.href = '/login'
      return
    }

    Promise.all([getCurrentAdmin(token), getAdminSettings()])
      .then(([adminData, settingsData]) => {
        setAdmin(adminData)
        setSettings(normalizeSettings(settingsData))
        localStorage.setItem('user', JSON.stringify(adminData))
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      })
      .finally(() => setLoading(false))
  }, [])

  function updateProfile<K extends keyof AdminProfileSettings>(key: K, value: AdminProfileSettings[K]) {
    setSettings((current) => ({ ...current, profile: { ...current.profile, [key]: value } }))
  }

  function updatePlatform<K extends keyof AdminPlatformSettings>(key: K, value: AdminPlatformSettings[K]) {
    setSettings((current) => ({ ...current, platform: { ...current.platform, [key]: value } }))
  }

  function updateApproval<K extends keyof AdminApprovalSettings>(key: K, value: AdminApprovalSettings[K]) {
    setSettings((current) => ({ ...current, approval: { ...current.approval, [key]: value } }))
  }

  function updateSupport<K extends keyof AdminSupportDisputeSettings>(key: K, value: AdminSupportDisputeSettings[K]) {
    setSettings((current) => ({ ...current, supportDisputes: { ...current.supportDisputes, [key]: value } }))
  }

  async function save(section: SaveSection) {
    setSaving(section)
    setMessage('')
    setError('')

    try {
      if (section === 'profile') {
        let profile = await updateAdminProfileSettings(settings.profile)
        if (avatarFile && profile.id) {
          const avatar = await uploadAdminUserAvatar(profile.id, avatarFile)
          profile = { ...profile, avatar }
          setAvatarFile(null)
        }
        setSettings((current) => ({
          ...current,
          profile: { ...profile, currentPassword: '', newPassword: '', phone: profile.phone ?? '', avatar: profile.avatar ?? '' },
        }))
        setAdmin((current) => current ? { ...current, fullName: profile.fullName, email: profile.email, avatar: profile.avatar || null } : current)
      } else if (section === 'platform') {
        let platformPayload = { ...settings.platform }
        if (logoFile) {
          platformPayload = { ...platformPayload, logoUrl: await uploadAdminSettingsAsset(logoFile) }
          setLogoFile(null)
        }
        if (faviconFile) {
          platformPayload = { ...platformPayload, faviconUrl: await uploadAdminSettingsAsset(faviconFile) }
          setFaviconFile(null)
        }
        setSettings(normalizeSettings(await updateAdminPlatformSettings(platformPayload)))
      } else if (section === 'approval') {
        setSettings(normalizeSettings(await updateAdminApprovalSettings(settings.approval)))
      } else {
        setSettings(normalizeSettings(await updateAdminSupportDisputeSettings(settings.supportDisputes)))
      }
      setMessage('Đã lưu cài đặt thành công.')
    } catch (err: any) {
      setError(typeof err?.response?.data === 'string' ? err.response.data : 'Không thể lưu cài đặt. Vui lòng thử lại.')
    } finally {
      setSaving('')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] text-sm font-semibold text-slate-600">
        Đang tải cài đặt...
      </div>
    )
  }

  return (
    <AdminLayout activePath="/admin/settings" adminName={admin?.fullName}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div role="heading" aria-level={1} className="text-2xl font-bold tracking-normal text-slate-950">
              Cài đặt hệ thống
            </div>
          </div>
          <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-700">
            Admin Settings
          </div>
        </div>

        {message ? <Notice tone="success">{message}</Notice> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <SettingsCard
            title="Hồ sơ quản trị viên"
            icon={<UserIcon />}
            actionLabel="Lưu hồ sơ"
            saving={saving === 'profile'}
            onSave={() => save('profile')}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ tên">
                <input className={inputClass} value={settings.profile.fullName} onChange={(e) => updateProfile('fullName', e.target.value)} />
              </Field>
              <Field label="Email">
                <input className={inputClass} type="email" value={settings.profile.email} onChange={(e) => updateProfile('email', e.target.value)} />
              </Field>
              <Field label="Số điện thoại">
                <input className={inputClass} value={settings.profile.phone ?? ''} onChange={(e) => updateProfile('phone', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Ảnh đại diện</span>
                <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-blue-100 text-lg font-bold text-blue-800">
                    {avatarPreview(settings.profile.avatar, avatarFile) ? (
                      <img src={avatarPreview(settings.profile.avatar, avatarFile) ?? ''} alt="Ảnh đại diện admin" className="h-full w-full object-cover" />
                    ) : (
                      getInitials(settings.profile.fullName)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{avatarFile ? avatarFile.name : 'Chọn ảnh từ máy tính'}</p>
                    <p className="mt-1 text-xs text-slate-500">Hỗ trợ JPG, PNG hoặc WebP. Ảnh sẽ được tải lên khi lưu hồ sơ.</p>
                  </div>
                  <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50">
                    Tải ảnh lên
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  {avatarFile ? (
                    <button
                      type="button"
                      onClick={() => setAvatarFile(null)}
                      className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-600 hover:bg-white"
                    >
                      Bỏ chọn
                    </button>
                  ) : null}
                </div>
              </div>
              <Field label="Mật khẩu hiện tại">
                <input className={inputClass} type="password" value={settings.profile.currentPassword ?? ''} onChange={(e) => updateProfile('currentPassword', e.target.value)} />
              </Field>
              <Field label="Mật khẩu mới">
                <input className={inputClass} type="password" value={settings.profile.newPassword ?? ''} onChange={(e) => updateProfile('newPassword', e.target.value)} />
              </Field>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Cài đặt nền tảng"
            icon={<GlobeIcon />}
            actionLabel="Lưu nền tảng"
            saving={saving === 'platform'}
            onSave={() => save('platform')}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên hệ thống">
                <input className={inputClass} value={settings.platform.siteName} onChange={(e) => updatePlatform('siteName', e.target.value)} />
              </Field>
              <Field label="Tên thương hiệu">
                <input className={inputClass} value={settings.platform.brandName} onChange={(e) => updatePlatform('brandName', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <AssetUpload
                  label="Logo"
                  currentUrl={settings.platform.logoUrl}
                  file={logoFile}
                  onFileChange={setLogoFile}
                  onClear={() => setLogoFile(null)}
                  hint="Logo dùng cho Navbar, sidebar và các khu vực nhận diện thương hiệu."
                />
              </div>
              <div className="sm:col-span-2">
                <AssetUpload
                  label="Favicon"
                  currentUrl={settings.platform.faviconUrl}
                  file={faviconFile}
                  onFileChange={setFaviconFile}
                  onClear={() => setFaviconFile(null)}
                  compact
                  hint="Favicon dùng trên tab trình duyệt. Nên dùng ảnh vuông PNG hoặc WebP."
                />
              </div>
              <Field label="Hotline">
                <input className={inputClass} value={settings.platform.hotline} onChange={(e) => updatePlatform('hotline', e.target.value)} />
              </Field>
              <Field label="Email hỗ trợ">
                <input className={inputClass} type="email" value={settings.platform.supportEmail} onChange={(e) => updatePlatform('supportEmail', e.target.value)} />
              </Field>
              <Field label="Địa chỉ văn phòng" wide>
                <input className={inputClass} value={settings.platform.officeAddress} onChange={(e) => updatePlatform('officeAddress', e.target.value)} />
              </Field>
              <Field label="Giờ làm việc" wide>
                <input className={inputClass} value={settings.platform.workingHours} onChange={(e) => updatePlatform('workingHours', e.target.value)} />
              </Field>
              <Field label="Zalo URL">
                <input className={inputClass} value={settings.platform.zaloUrl} onChange={(e) => updatePlatform('zaloUrl', e.target.value)} />
              </Field>
              <Field label="Messenger URL">
                <input className={inputClass} value={settings.platform.messengerUrl} onChange={(e) => updatePlatform('messengerUrl', e.target.value)} />
              </Field>
              <Field label="Facebook URL" wide>
                <input className={inputClass} value={settings.platform.facebookUrl} onChange={(e) => updatePlatform('facebookUrl', e.target.value)} />
              </Field>
            </div>
          </SettingsCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <SettingsCard
            title="Duyệt gia sư và lớp học"
            icon={<ShieldIcon />}
            actionLabel="Lưu quy trình duyệt"
            saving={saving === 'approval'}
            onSave={() => save('approval')}
          >
            <div className="grid gap-4">
              <Toggle checked={settings.approval.requireTutorVerification} onChange={(value) => updateApproval('requireTutorVerification', value)} title="Yêu cầu admin duyệt hồ sơ gia sư" />
              <Toggle checked={settings.approval.tutorMustBeVerifiedToOpenClass} onChange={(value) => updateApproval('tutorMustBeVerifiedToOpenClass', value)} title="Chỉ gia sư đã xác thực mới được mở lớp" />
              <Toggle checked={settings.approval.requireClassApproval} onChange={(value) => updateApproval('requireClassApproval', value)} title="Lớp học cần admin duyệt trước khi hiển thị" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Số lớp tối đa khi chưa xác thực">
                  <input className={inputClass} min="0" type="number" value={settings.approval.maxClassesForUnverifiedTutor} onChange={(e) => updateApproval('maxClassesForUnverifiedTutor', Number(e.target.value))} />
                </Field>
                <Field label="Tự đóng lớp sau số ngày">
                  <input className={inputClass} min="0" type="number" value={settings.approval.autoCloseClassAfterDays} onChange={(e) => updateApproval('autoCloseClassAfterDays', Number(e.target.value))} />
                </Field>
              </div>
              <Field label="Giấy tờ bắt buộc">
                <textarea className={textareaClass} rows={3} value={settings.approval.requiredTutorDocuments} onChange={(e) => updateApproval('requiredTutorDocuments', e.target.value)} />
              </Field>
              <Field label="Thông báo khi duyệt hồ sơ">
                <textarea className={textareaClass} rows={3} value={settings.approval.tutorApprovedMessage} onChange={(e) => updateApproval('tutorApprovedMessage', e.target.value)} />
              </Field>
              <Field label="Thông báo khi từ chối hồ sơ">
                <textarea className={textareaClass} rows={3} value={settings.approval.tutorRejectedMessage} onChange={(e) => updateApproval('tutorRejectedMessage', e.target.value)} />
              </Field>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Hỗ trợ và tranh chấp"
            icon={<SupportSettingsIcon />}
            actionLabel="Lưu hỗ trợ"
            saving={saving === 'supportDisputes'}
            onSave={() => save('supportDisputes')}
          >
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SLA hỗ trợ (giờ)">
                  <input className={inputClass} min="1" type="number" value={settings.supportDisputes.supportSlaHours} onChange={(e) => updateSupport('supportSlaHours', Number(e.target.value))} />
                </Field>
                <Field label="Hạn bổ sung bằng chứng (giờ)">
                  <input className={inputClass} min="1" type="number" value={settings.supportDisputes.evidenceDeadlineHours} onChange={(e) => updateSupport('evidenceDeadlineHours', Number(e.target.value))} />
                </Field>
              </div>
              <Field label="Danh mục hỗ trợ">
                <textarea className={textareaClass} rows={3} value={settings.supportDisputes.supportCategories} onChange={(e) => updateSupport('supportCategories', e.target.value)} />
              </Field>
              <Field label="Lý do tranh chấp">
                <textarea className={textareaClass} rows={3} value={settings.supportDisputes.disputeReasons} onChange={(e) => updateSupport('disputeReasons', e.target.value)} />
              </Field>
              <Field label="Chính sách hoàn tiền mặc định">
                <textarea className={textareaClass} rows={3} value={settings.supportDisputes.defaultRefundPolicy} onChange={(e) => updateSupport('defaultRefundPolicy', e.target.value)} />
              </Field>
              <Field label="Thông báo yêu cầu bằng chứng">
                <textarea className={textareaClass} rows={3} value={settings.supportDisputes.needEvidenceMessage} onChange={(e) => updateSupport('needEvidenceMessage', e.target.value)} />
              </Field>
              <Field label="Thông báo khi xử lý xong tranh chấp">
                <textarea className={textareaClass} rows={3} value={settings.supportDisputes.disputeResolvedMessage} onChange={(e) => updateSupport('disputeResolvedMessage', e.target.value)} />
              </Field>
            </div>
          </SettingsCard>
        </div>
      </div>
    </AdminLayout>
  )
}

const inputClass = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const textareaClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function normalizeSettings(data: AdminSettingsData): AdminSettingsData {
  return {
    profile: { ...emptySettings.profile, ...data.profile, currentPassword: '', newPassword: '' },
    platform: { ...emptySettings.platform, ...data.platform },
    approval: { ...emptySettings.approval, ...data.approval },
    supportDisputes: { ...emptySettings.supportDisputes, ...data.supportDisputes },
  }
}

function avatarPreview(currentAvatar: string | null | undefined, file: File | null) {
  if (file) return URL.createObjectURL(file)
  return currentAvatar || ''
}

function getInitials(name?: string) {
  if (!name) return 'AD'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD'
}

function SettingsCard({ title, icon, children, actionLabel, saving, onSave }: {
  title: string
  icon: ReactNode
  children: ReactNode
  actionLabel: string
  saving: boolean
  onSave: () => void
}) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex h-9 items-center rounded-lg bg-blue-700 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Đang lưu...' : actionLabel}
        </button>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? 'sm:col-span-2' : ''}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, title }: { checked: boolean; onChange: (value: boolean) => void; title: string }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-800">{title}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
      />
    </label>
  )
}

function AssetUpload({
  label,
  currentUrl,
  file,
  onFileChange,
  onClear,
  hint,
  compact,
}: {
  label: string
  currentUrl: string
  file: File | null
  onFileChange: (file: File | null) => void
  onClear: () => void
  hint: string
  compact?: boolean
}) {
  const preview = avatarPreview(currentUrl, file)

  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-white ${compact ? 'h-12 w-12' : 'h-16 w-28'}`}>
          {preview ? (
            <img src={preview} alt={label} className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-xs font-bold text-slate-400">No image</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{file ? file.name : currentUrl || `Chọn file ${label.toLowerCase()}`}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50">
          Tải ảnh lên
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/x-icon"
            className="sr-only"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
        </label>
        {file ? (
          <button
            type="button"
            onClick={onClear}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-600 hover:bg-white"
          >
            Bỏ chọn
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Notice({ tone, children }: { tone: 'success' | 'error'; children: ReactNode }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
      tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
    }`}>
      {children}
    </div>
  )
}

function Svg({ children }: { children: ReactNode }) {
  return <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">{children}</svg>
}
function UserIcon() { return <Svg><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></Svg> }
function GlobeIcon() { return <Svg><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></Svg> }
function ShieldIcon() { return <Svg><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-5" /></Svg> }
function SupportSettingsIcon() { return <Svg><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H4zM17 14h3v5h-3z" /><path d="M13 19h2a5 5 0 0 0 5-5" /></Svg> }
