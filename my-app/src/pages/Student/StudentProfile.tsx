import { useEffect, useState, useRef } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { getUserProfile, updateUserProfile, uploadAvatar, type UserProfileResponse } from '../../api/userProfile'
import { getMediaUrl } from '../../api/axios'

const GENDER_LABELS: Record<string, string> = {
  male: 'Nam',
  female: 'Nữ',
}

export default function StudentProfile() {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const userId = user?.id ? Number(user.id) : 0

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState<{
    fullName: string;
    phone: string;
    gender: string;
    birthday: number | string;
  }>({
    fullName: '',
    phone: '',
    gender: '',
    birthday: 2000
  })

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) return
    getUserProfile(userId)
      .then((data) => {
        setProfile(data)
        setFormData({
          fullName: data.fullName || '',
          phone: data.phone || '',
          gender: data.gender || '',
          birthday: data.birthday || 2000
        })
      })
      .catch(() => { })
  }, [userId])

  const handleSave = () => {
    console.log("Dữ liệu chuẩn bị gửi đi:", formData);
    updateUserProfile(userId, formData)
      .then((message) => {
        alert(message);
        setIsEditing(false);

        if (profile) {
          setProfile({
            ...profile,
            fullName: formData.fullName,
            phone: formData.phone,
            gender: formData.gender,
            birthday: formData.birthday
          });
        }
      })
      .catch((error) => {
        console.error("Lỗi cập nhật:", error);
        alert("Cập nhật thất bại: " + (error.response?.data || error.message));
      });
  };

  // Hàm xử lý khi người dùng chọn xong ảnh
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Gọi API ném file xuống backend
      const newAvatarUrl = await uploadAvatar(userId, file);

      // Nếu thành công, cập nhật ngay ảnh trên màn hình
      if (profile) {
        setProfile({ ...profile, avatar: newAvatarUrl });
      }
      alert("Cập nhật ảnh đại diện thành công!");
    } catch (error: any) {
      alert("Lỗi khi tải ảnh lên: " + (error.response?.data || error.message));
    }
  };

  if (!profile) return (
    <AccountLayout>
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </AccountLayout>
  )

  const avatarUrl = getMediaUrl(profile.avatar)

  return (
    <AccountLayout activePath="/student/profile">
      <div className="min-h-screen bg-[#f0f2f5] w-full text-left pb-12">

        {/* ================= HEADER TRẮNG ================= */}
        <div className="bg-white shadow-sm mb-8">
          <div className="max-w-5xl mx-auto w-full">

            {/* 1. ẢNH BÌA XANH */}
            <div className="h-28 md:h-40 bg-[#4267b2] w-full"></div>

            {/* 2. AVATAR, TÊN VÀ NÚT */}
            <div className="px-6 md:px-10 pb-4 flex flex-col md:flex-row md:items-end justify-between relative">

              <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">

                <div className="-mt-[70px] md:-mt-[90px] relative z-10 w-[140px] h-[140px] md:w-[180px] md:h-[180px] shrink-0 mx-auto md:mx-0">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                  />

                  <div className="w-full h-full rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-5xl font-bold text-[#4267b2] overflow-hidden shadow-sm">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile.fullName?.charAt(0)
                    )}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-white hover:bg-slate-50 text-blue-600 rounded-full border-2 border-white flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(0,0,0,0.15)] z-20"
                    title="Thay đổi ảnh đại diện"
                  >
                    {/* Icon máy ảnh */}
                    <i className="fa-solid fa-camera text-lg"></i>
                  </button>
                </div>

                {/* KHỐI TÊN */}
                <div className="mb-2 md:mb-5 text-center md:text-left">
                  <h1
                    className="text-xl md:text-2xl font-bold tracking-tight m-0 leading-none"
                    style={{ color: '#111827' }}
                  >
                    {profile.fullName || 'Học viên ẩn danh'}
                  </h1>
                  <p className="text-[#0084ff] font-medium mt-1.5 m-0 text-[15px]">
                    Học viên
                  </p>
                </div>
              </div>

              {/* Nhóm Nút Bấm Góc Phải */}
              <div className="mb-2 md:mb-4 flex justify-center md:justify-end w-full md:w-auto mt-3 md:mt-0">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-[#00a859] text-white font-semibold rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    Chỉnh sửa hồ sơ <i className="fa-solid fa-pen text-sm"></i>
                  </button>
                ) : (
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 md:flex-none px-8 py-2 bg-[#d32f2f] text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 md:flex-none px-8 py-2 bg-[#00a859] text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ================= KHU VỰC THÔNG TIN CÁ NHÂN ================= */}
        <div className="max-w-5xl mx-auto w-full px-4 md:px-10">

          <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#b8860b' }}>
            Thông tin cá nhân
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label className="text-[15px] font-medium text-slate-500 block mb-2">Họ và tên</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg font-medium text-slate-900 outline-none focus:border-[#00a859]"
                />
              ) : (
                <p className="text-xl md:text-2xl font-medium" style={{ color: '#111827' }}>
                  {profile.fullName || '—'}
                </p>
              )}
            </div>

            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label className="text-[15px] font-medium text-slate-500 block mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full border border-slate-300 bg-slate-50 rounded-lg px-3 py-2 text-lg font-medium text-slate-600 outline-none cursor-not-allowed"
                />
              ) : (
                <p className="text-xl md:text-2xl font-medium truncate" style={{ color: '#111827' }} title={profile.email}>
                  {profile.email || '—'}
                </p>
              )}
            </div>

            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
              <label className="text-[15px] font-medium text-slate-500 block mb-2">Số Điện Thoại</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg font-medium text-slate-900 outline-none focus:border-[#00a859]"
                />
              ) : (
                <p className="text-xl md:text-2xl font-medium" style={{ color: '#111827' }}>
                  {profile.phone || '—'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-5">

              <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <label className="text-[15px] font-medium text-slate-500 block mb-2">Giới Tính</label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg font-medium text-slate-900 outline-none focus:border-[#00a859] cursor-pointer"
                  >
                    <option value="">Chọn</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                ) : (
                  <p className="text-xl md:text-2xl font-medium" style={{ color: '#111827' }}>
                    {GENDER_LABELS[profile.gender] || '—'}
                  </p>
                )}
              </div>

              <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <label className="text-[15px] font-medium text-slate-500 block mb-2">Năm sinh</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-lg font-medium text-slate-900 outline-none focus:border-[#00a859]"
                  />
                ) : (
                  <p className="text-xl md:text-2xl font-medium" style={{ color: '#111827' }}>
                    {profile.birthday || '—'}
                  </p>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>
    </AccountLayout>
  )
}