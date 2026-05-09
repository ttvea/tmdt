import { getTutorProfile } from '../api/tutorProfile'

const navItems = ["Tìm gia sư", "Cách hoạt động", "Bảng giá", "Tài nguyên"];

function Navbar() {
  const userRaw = localStorage.getItem("user");
  const token = localStorage.getItem("access_token");
  const isLoggedIn = !!(token && userRaw);
  const user = userRaw ? JSON.parse(userRaw) : null
  const isTutor = user?.role === 'tutor'

  const handleAccountClick = async (e: React.MouseEvent) => {
    if (!isTutor) return // student đi thẳng href bình thường

    e.preventDefault()
    try {
      const profile = await getTutorProfile(user.id)
      // Có profile và đã điền occupationType → đã hoàn tất đăng ký
      if (profile?.occupationType) {
        window.location.href = '/tutor/profile'
      } else {
        window.location.href = '/tutor/info'
      }
    } catch {
      // Chưa có profile → lần đầu đăng ký
      window.location.href = '/tutor/info'
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="text-xl font-bold tracking-tight text-blue-700">
          EduMatch Pro
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navItems.map((item, index) => (
            <a
              key={item}
              href="#"
              className={
                index === 0
                  ? "border-b-2 border-blue-700 pb-1 text-blue-700"
                  : "text-slate-600 transition hover:text-blue-700"
              }
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <a
              href={isTutor ? '/tutor/profile' : '/student/profile'}
              onClick={handleAccountClick}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />
              </svg>
              Tài khoản
            </a>
          ) : (
            <>
              <a href="/login" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                Đăng nhập
              </a>
              <a
                href="/register"
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Đăng ký
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
