function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
              <i className="bi bi-mortarboard-fill text-blue-600 text-2xl"></i>
              EduMatch Pro
            </h3>
            <p className="text-sm text-slate-600 mb-2">Nền tảng kết nối gia sư 1 kèm 1</p>
            <p className="text-sm text-slate-600 mb-1">107A Nguyễn Phong Sắc, Dịch Vọng Hậu, Cầu Giấy, Hà Nội</p>
            <p className="text-sm text-slate-600 mb-1">Hotline: <a href="tel:0369148660" className="text-blue-600 hover:underline">0369 148 660</a></p>
            <p className="text-sm text-slate-600 mb-1">Email: <a href="mailto:giasuhome.vn@gmail.com" className="text-blue-600 hover:underline">giasuhome.vn@gmail.com</a></p>
            <p className="text-sm text-slate-500">Thứ 2 - CN: 08:00 - 22:00</p>
          </div>

          {/* Documents */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4">Tài liệu</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-slate-600 hover:text-blue-600">Hợp đồng giao lớp</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-blue-600">Hợp đồng gia sư</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-blue-600">Báo cáo học tập</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-blue-600">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-blue-600">Tuyển dụng</a></li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4">Tư vấn</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-slate-600 hover:text-blue-600">Giới thiệu</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-blue-600">Blog</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-blue-600">Hỏi đáp</a></li>
              <li><a href="#" className="text-sm text-slate-600 hover:text-blue-600">Liên hệ</a></li>
            </ul>
          </div>

          {/* Social & CTA */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4">Kết nối với chúng tôi</h4>
            <div className="flex gap-2 mb-4">
              <a href="#" className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-600 transition text-lg">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-600 transition text-lg">
                <i className="bi bi-messenger"></i>
              </a>
              <a href="#" className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-600 transition text-lg">
                <i className="bi bi-youtube"></i>
              </a>
            </div>
            <a href="/register" className="block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
              Đăng lớp ngay
            </a>
          </div>
        </div>

        <hr className="my-6 border-slate-200" />

        {/* Copyright */}
        <p className="text-center text-sm text-slate-500">© 2026 EduMatch Pro. All rights reserved.</p>
      </div>

      {/* Floating Contact (Mobile) */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 md:hidden">
        <a href="tel:0369148660" className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg hover:bg-green-700" title="Gọi">
          <i className="bi bi-telephone-fill"></i>
        </a>
        <a href="#" className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700" title="Chat">
          <i className="bi bi-chat-dots-fill"></i>
        </a>
      </div>
    </footer>
  );
}

export default Footer;
