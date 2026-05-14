import { getTutorProfile } from '../api/tutorProfile'

function Navbar() {
  const userRaw = localStorage.getItem("user");
  const token = localStorage.getItem("access_token");
  const isLoggedIn = !!(token && userRaw);
  const user = userRaw ? JSON.parse(userRaw) : null
  const isTutor = user?.role === 'tutor'

  const handleAccountClick = async (e: React.MouseEvent) => {
    if (!isTutor) return

    e.preventDefault()
    try {
      const profile = await getTutorProfile(user.id)
      if (profile?.occupationType) {
        window.location.href = '/tutor/profile'
      } else {
        window.location.href = '/tutor/info'
      }
    } catch {
      window.location.href = '/tutor/info'
    }
  }

  return (
    <>
      {/* Promo Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 py-2 px-4 text-center text-sm">
        🎉 <strong>Khai trương:</strong> Miễn phí đăng lớp & học thử 1 buổi — <a href="/register" className="text-blue-600 hover:underline font-semibold">Đăng ký ngay</a>
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <i className="bi bi-mortarboard-fill text-blue-600 text-2xl"></i>
              EduMatch Pro
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="/" className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">Trang chủ</a>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">Giới thiệu</a>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">Học phí</a>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">Blog</a>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">Hỏi đáp</a>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">Liên hệ</a>
              <div className="relative group">
                <button className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1">
                  Khám phá
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
                <div className="hidden group-hover:block absolute left-0 mt-0 w-48 bg-white rounded-md shadow-lg py-2 z-10">
                  <a href="#" className="block px-4 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50">Tìm gia sư</a>
                  <a href="#" className="block px-4 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50">Tìm lớp học</a>
                </div>
              </div>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <a
                  href={isTutor ? '/tutor/profile' : '/student/profile'}
                  onClick={handleAccountClick}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Tài khoản
                </a>
              ) : (
                <>
                  <a href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600">
                    Đăng nhập
                  </a>
                  <a
                    href="/register"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    Đăng lớp ngay
                  </a>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;
