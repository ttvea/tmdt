function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
        <p className="text-lg font-bold text-slate-950">EduMatch Pro</p>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          <a href="#" className="hover:text-blue-700">
            Chính sách bảo mật
          </a>
          <a href="#" className="hover:text-blue-700">
            Điều khoản dịch vụ
          </a>
          <a href="#" className="hover:text-blue-700">
            Chính sách cookie
          </a>
          <a href="#" className="hover:text-blue-700">
            Liên hệ hỗ trợ
          </a>
        </nav>

        <p className="text-sm text-slate-500">© 2026 EduMatch Pro</p>
      </div>
    </footer>
  );
}

export default Footer;
