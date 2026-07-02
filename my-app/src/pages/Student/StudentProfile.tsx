import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { AccountLayout } from '../../components/AccountLayout'
import { getUserProfile, updateUserProfile, uploadAvatar, type UserProfileResponse } from '../../api/userProfile'
import { getMediaUrl } from '../../api/axios'

const GENDER_LABELS: Record<string, string> = {
  male: 'Nam',
  female: 'Nữ',
}

type FormData = {
  fullName: string
  phone: string
  gender: string
  birthday: number | string
}

export default function StudentProfile() {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const userId = user?.id ? Number(user.id) : 0

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    gender: '',
    birthday: 2000,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userId) return
    getUserProfile(userId)
      .then((data) => {
        setProfile(data)
        setFormData({
          fullName: data.fullName || '',
          phone: data.phone || '',
          gender: data.gender || '',
          birthday: data.birthday || 2000,
        })
      })
      .catch(() => toast.error('Không thể tải hồ sơ học viên'))
  }, [userId])

  const resetForm = () => {
    if (!profile) return
    setFormData({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      gender: profile.gender || '',
      birthday: profile.birthday || 2000,
    })
    setIsEditing(false)
  }

  const handleSave = () => {
    updateUserProfile(userId, formData)
      .then((message) => {
        toast.success(message)
        setIsEditing(false)

        if (profile) {
          const updatedProfile = {
            ...profile,
            fullName: formData.fullName,
            phone: formData.phone,
            gender: formData.gender,
            birthday: formData.birthday,
          }
          setProfile(updatedProfile)
          if (userRaw) {
            localStorage.setItem('user', JSON.stringify({ ...user, fullName: formData.fullName, phone: formData.phone }))
          }
        }
      })
      .catch((error) => {
        toast.error('Cập nhật thất bại: ' + (error.response?.data || error.message))
      })
  }


  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const newAvatarUrl = await uploadAvatar(userId, file)
      if (profile) {
        setProfile({ ...profile, avatar: newAvatarUrl })
      }
      if (userRaw) {
        localStorage.setItem('user', JSON.stringify({ ...user, avatar: newAvatarUrl }))
      }
      toast.success('Cập nhật ảnh đại diện thành công')
    } catch (error: any) {
      toast.error('Lỗi khi tải ảnh lên: ' + (error.response?.data || error.message))
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!profile) {
    return (
      <AccountLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-100 border-b-blue-700"></div>
        </div>
      </AccountLayout>
    )
  }

  const avatarUrl = getMediaUrl(profile.avatar)
  const displayName = profile.fullName || 'Học viên ẩn danh'
  const initial = displayName.charAt(0).toUpperCase()
  const completionItems = [
    Boolean(profile.fullName),
    Boolean(profile.email),
    Boolean(profile.phone),
    Boolean(profile.gender),
    Boolean(profile.birthday),
  ]
  const completionPercent = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100)

  return (
    <AccountLayout activePath="/student/profile">
      <div className="min-h-screen bg-slate-100 px-5 py-8 text-left sm:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="relative">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 shadow-sm sm:h-28 sm:w-28">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-blue-700">
                        {initial}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white shadow-lg transition hover:bg-blue-800"
                      title="Cập nhật ảnh đại diện"
                    >
                      <i className="fa-solid fa-camera text-sm"></i>
                    </button>
                  </div>

                  <div>
                    <h1 className="m-0 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                      {displayName}
                    </h1>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <i className="fa-regular fa-envelope text-blue-600"></i>
                        {profile.email || 'Chưa cập nhật email'}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <i className="fa-solid fa-phone text-blue-600"></i>
                        {profile.phone || 'Chưa cập nhật số điện thoại'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
                    >
                      <i className="fa-solid fa-pen"></i>
                      Chỉnh sửa hồ sơ
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        Lưu thay đổi
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Hồ sơ học viên</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">Thông tin cá nhân</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  Cập nhật {completionPercent}%
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ProfileField
                  label="Họ và tên"
                  icon="fa-regular fa-user"
                  editing={isEditing}
                  value={profile.fullName}
                  input={
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={inputClass}
                    />
                  }
                />
                <ProfileField
                  label="Email"
                  icon="fa-regular fa-envelope"
                  value={profile.email}
                  input={<input type="email" value={profile.email} readOnly className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`} />}
                />
                <ProfileField
                  label="Số điện thoại"
                  icon="fa-solid fa-phone"
                  editing={isEditing}
                  value={profile.phone}
                  input={
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={inputClass}
                    />
                  }
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField
                    label="Giới tính"
                    icon="fa-solid fa-venus-mars"
                    editing={isEditing}
                    value={GENDER_LABELS[profile.gender]}
                    input={
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Chọn</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                      </select>
                    }
                  />
                  <ProfileField
                    label="Năm sinh"
                    icon="fa-regular fa-calendar"
                    editing={isEditing}
                    value={profile.birthday}
                    input={
                      <input
                        type="number"
                        value={formData.birthday}
                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                        className={inputClass}
                      />
                    }
                  />
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950">Mức độ hoàn thiện</h3>
                    <p className="text-sm text-slate-500">Bổ sung thông tin để hồ sơ đáng tin cậy hơn.</p>
                  </div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-700" style={{ width: `${completionPercent}%` }} />
                </div>
                <p className="mt-2 text-sm font-semibold text-blue-700">{completionPercent}% hồ sơ đã hoàn thiện</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-bold text-slate-950">Bảo mật tài khoản</h3>
                <div className="space-y-3 text-sm text-slate-600">
                  <InfoLine icon="fa-solid fa-key" text="Mật khẩu có thể thay đổi bất cứ lúc nào." />
                  <InfoLine icon="fa-solid fa-image" text="Ảnh đại diện giúp gia sư dễ nhận diện bạn hơn." />
                  <InfoLine icon="fa-solid fa-circle-check" text="Email được dùng để nhận thông báo hệ thống." />
                </div>
              </div>
            </aside>
          </section>
        </div>

      </div>
    </AccountLayout>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100'

function ProfileField({
  label,
  icon,
  value,
  editing,
  input,
}: {
  label: string
  icon: string
  value: string | number | null | undefined
  editing?: boolean
  input: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
          <i className={icon}></i>
        </span>
        {label}
      </div>
      {editing ? input : <p className="truncate text-xl font-bold text-slate-950">{value || '—'}</p>}
    </div>
  )
}

function InfoLine({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-blue-700">
        <i className={icon}></i>
      </span>
      <span>{text}</span>
    </div>
  )
}

