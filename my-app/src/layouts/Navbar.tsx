const navItems = ["Tìm gia sư", "Cách hoạt động", "Bảng giá", "Tài nguyên"];

function Navbar() {
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
          <a href="/login" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
            Đăng nhập
          </a>
          <a
            href="/register"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            Đăng ký
          </a>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
