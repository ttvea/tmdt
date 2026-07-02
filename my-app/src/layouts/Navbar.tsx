import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getTutorProfile } from "../api/tutorProfile";
import { getMediaUrl } from "../api/axios";
import { changePassword } from "../api/userProfile";
import { isTutorRole } from "../utils/userRole";

function Navbar() {
  const pathname = window.location.pathname;
  const userRaw = localStorage.getItem("user");
  const token = localStorage.getItem("access_token");
  const isLoggedIn = !!(token && userRaw);
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isTutor = isTutorRole(user?.role);
  const [accountProfile, setAccountProfile] = useState<{ avatar?: string | null; fullName?: string | null } | null>(null);
  const discoverActive = pathname.startsWith("/discover");
  const accountHref = isTutor ? "/tutor/profile" : "/student/profile";
  const accountName =
    accountProfile?.fullName || user?.fullName || user?.name || user?.username || user?.email?.split("@")[0] || "T\u00e0i kho\u1ea3n";
  const accountAvatarUrl = getMediaUrl(accountProfile?.avatar || user?.avatar);
  const accountRoleLabel = isTutor ? "Gia s\u01b0" : "H\u1ecdc vi\u00ean";
  const accountInitials = String(accountName)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "U";
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!isLoggedIn || !isTutor || !user?.id) {
      setAccountProfile(null);
      return;
    }

    getTutorProfile(Number(user.id))
      .then((profile) => {
        setAccountProfile({ avatar: profile.avatar, fullName: profile.fullName });
        if (userRaw) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...user,
              avatar: profile.avatar || user.avatar,
              fullName: profile.fullName || user.fullName,
            }),
          );
        }
      })
      .catch(() => {});
  }, [isLoggedIn, isTutor, user?.id]);

  const handleAccountClick = async (event: React.MouseEvent) => {
    if (!isTutor) return;

    event.preventDefault();
    try {
      const profile = await getTutorProfile(user.id);
      window.location.href = profile?.occupationType ? "/tutor/profile" : "/tutor/info";
    } catch {
      window.location.href = "/tutor/info";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const closeChangePassword = () => {
    setShowChangePassword(false);
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleChangePassword = async () => {
    if (!user?.id) {
      toast.error("Không tìm thấy thông tin tài khoản");
      return;
    }
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setChangingPassword(true);
    try {
      const message = await changePassword(Number(user.id), passwordData.currentPassword, passwordData.newPassword);
      toast.success(message);
      closeChangePassword();
    } catch (error: any) {
      toast.error(error.response?.data || error.message || "Không thể đổi mật khẩu");
    } finally {
      setChangingPassword(false);
    }
  };

  const navLinkClass = (href: string) =>
    `text-sm font-medium ${
      pathname === href
        ? "border-b-2 border-blue-600 pb-1 text-blue-600"
        : "text-slate-600 hover:text-blue-600"
    }`;

  return (
    <>
      {pathname === "/" ? (
        <div className="border-b border-yellow-200 bg-yellow-50 px-4 py-2 text-center text-sm">
          <strong>Khai trương:</strong> Miễn phí đăng lớp và học thử 1 buổi -{" "}
          <a href="/register" className="font-semibold text-blue-600 hover:underline">
            Đăng ký ngay
          </a>
        </div>
      ) : null}

      <header className="sticky top-0 z-50 w-full border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <i className="bi bi-mortarboard-fill text-2xl text-blue-600" />
              EduMatch Pro
            </a>

            <nav className="hidden items-center gap-8 md:flex">
              <a href="/" className={navLinkClass("/")}>
                Trang chủ
              </a>
              <a href="/about" className={navLinkClass("/about")}>
                Giới thiệu
              </a>
              <a href="/pricing" className={navLinkClass("/pricing")}>
                Học phí
              </a>
              <a href="/faq" className={navLinkClass("/faq")}>
                Hỏi đáp
              </a>
              <a href="/contact" className={navLinkClass("/contact")}>
                Liên hệ
              </a>
              
              {/* === TAB KHÁM PHÁ CÓ DROPDOWN === */}
              <div className="group relative">
                <button
                  className={`flex items-center gap-1 text-sm font-medium ${
                    discoverActive ? "text-blue-600" : "text-slate-600 hover:text-cyan-700"
                  }`}
                >
                  Khám phá
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m6 9 6 6 6-6"
                    />
                  </svg>
                </button>
                <div className="absolute left-0 z-10 mt-0 hidden w-48 rounded-md border border-blue-100 bg-white py-2 shadow-lg group-hover:block">
                  <a
                    href="/discover/tutors"
                    className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                  >
                    Tìm gia sư
                  </a>
                  <a
                    href="/discover/classes"
                    className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                  >
                    Tìm lớp học
                  </a>
                  <a
                    href="/discover/student-requests"
                    className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                  >
                    Bảng tin
                  </a>
                </div>
              </div>
            </nav>

            {/* KHOẢNG CHỨA NÚT BÊN PHẢI */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Nút Đăng lớp */}
              <a
                href="/post-class"
                className={`text-sm md:text-base font-semibold transition-colors ${
                  pathname === "/post-class" ? "text-blue-600" : "text-slate-900 hover:text-blue-600"
                }`}
              >
                Đăng lớp
              </a>

              {/* Vạch kẻ dọc phân cách */}
              <span className="h-4 w-[1px] bg-slate-300 hidden md:block"></span>

              {isLoggedIn ? (
                <div className="group relative">
                  <button
                    type="button"
                    className={`flex max-w-[230px] items-center gap-3 rounded-full border px-2.5 py-1.5 text-left shadow-sm transition md:max-w-[270px] ${
                      pathname.includes("/profile")
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-900 hover:border-blue-200 hover:bg-slate-50 hover:text-blue-700"
                    }`}
                    aria-haspopup="menu"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-bold text-white ring-2 ring-white">
                      {accountAvatarUrl ? (
                        <img src={accountAvatarUrl} alt={accountName} className="h-full w-full object-cover" />
                      ) : (
                        accountInitials
                      )}
                    </span>
                    <span className="hidden min-w-0 flex-col leading-tight sm:flex">
                      <span className="truncate text-sm font-bold">{accountName}</span>
                      <span className="truncate text-xs font-medium text-slate-500">{accountRoleLabel}</span>
                    </span>
                    <svg className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  <div className="invisible absolute right-0 top-full z-20 w-64 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl shadow-blue-950/20 ring-1 ring-blue-100">
                      <div className="flex items-center gap-3 border-b border-blue-800 bg-blue-700 px-4 py-3 text-white">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-sm font-bold text-white ring-2 ring-white/60">
                          {accountAvatarUrl ? (
                            <img src={accountAvatarUrl} alt={accountName} className="h-full w-full object-cover" />
                          ) : (
                            accountInitials
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{accountName}</span>
                          <span className="block truncate text-xs font-medium text-white/75">{accountRoleLabel}</span>
                        </span>
                      </div>
                      <div className="space-y-1 bg-slate-50 p-2">
                        <a
                          href={accountHref}
                          onClick={handleAccountClick}
                          className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-blue-600 hover:text-white"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 transition group-hover:bg-white">
                            <i className="bi bi-person-circle text-base" />
                          </span>
                          {"Trang c\u00e1 nh\u00e2n"}
                        </a>
                        <button
                          type="button"
                          onClick={() => setShowChangePassword(true)}
                          className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-blue-600 hover:text-white"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                            <i className="bi bi-key text-base" />
                          </span>
                          {"\u0110\u1ed5i m\u1eadt kh\u1ea9u"}
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-600 hover:text-white"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                            <i className="bi bi-box-arrow-right text-base" />
                          </span>
                          {"\u0110\u0103ng xu\u1ea5t"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Trạng thái chưa đăng nhập
                <div className="flex items-center gap-3">
                  {/* Nút Đăng nhập */}
                  <a
                    href="/login"
                    className={`text-sm md:text-base font-semibold transition-colors ${
                      pathname === "/login" ? "text-blue-600" : "text-slate-900 hover:text-blue-600"
                    }`}
                  >
                    Đăng nhập
                  </a>
                  <a
                    href="/register"
                    className="hidden md:block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Đăng ký
                  </a>
                </div>
              )}
            </div>

            <button className="p-2 md:hidden" aria-label="Mở menu">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {showChangePassword && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Bảo mật</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Đổi mật khẩu</h2>
              </div>
              <button
                type="button"
                onClick={closeChangePassword}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                aria-label="Đóng"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="space-y-4">
              <PasswordField
                label="Mật khẩu hiện tại"
                value={passwordData.currentPassword}
                onChange={(value) => setPasswordData({ ...passwordData, currentPassword: value })}
              />
              <PasswordField
                label="Mật khẩu mới"
                value={passwordData.newPassword}
                onChange={(value) => setPasswordData({ ...passwordData, newPassword: value })}
              />
              <PasswordField
                label="Xác nhận mật khẩu mới"
                value={passwordData.confirmPassword}
                onChange={(value) => setPasswordData({ ...passwordData, confirmPassword: value })}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeChangePassword}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

export default Navbar;
