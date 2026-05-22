import { getTutorProfile } from "../api/tutorProfile";
import { isTutorRole } from "../utils/userRole";

function Navbar() {
  const pathname = window.location.pathname;
  const userRaw = localStorage.getItem("user");
  const token = localStorage.getItem("access_token");
  const isLoggedIn = !!(token && userRaw);
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isTutor = isTutorRole(user?.role);
  const discoverActive = pathname.startsWith("/discover");

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
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-cyan-700">
                Blog
              </a>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-cyan-700">
                Hỏi đáp
              </a>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-cyan-700">
                Liên hệ
              </a>
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
                </div>
              </div>
            </nav>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <a
                  href={isTutor ? "/tutor/profile" : "/student/profile"}
                  onClick={handleAccountClick}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Tài khoản
                </a>
              ) : (
                <>
                  <a
                    href="/login"
                    className="text-sm font-semibold text-slate-700 hover:text-blue-600"
                  >
                    Đăng nhập
                  </a>
                  <a
                    href="/register"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Đăng lớp ngay
                  </a>
                </>
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
    </>
  );
}

export default Navbar;
