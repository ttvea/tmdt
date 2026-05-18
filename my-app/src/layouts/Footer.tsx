function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-950">
              <i className="bi bi-mortarboard-fill text-2xl text-blue-600" />
              EduMatch Pro
            </h3>
            <p className="mb-2 text-sm text-slate-600">Nền tảng kết nối gia sư 1 kèm 1</p>
            <p className="mb-1 text-sm text-slate-600">
              Khu phố 33, phường Linh Xuân, TP. Hồ Chí Minh
            </p>
            <p className="mb-1 text-sm text-slate-600">
              Hotline:{" "}
              <a href="tel:0369148660" className="text-blue-600 hover:underline">
                0369 148 660
              </a>
            </p>
            <p className="mb-1 text-sm text-slate-600">
              Email:{" "}
              <a href="mailto:edumatchpro.vn@gmail.com" className="text-blue-600 hover:underline">
                edumatchpro@gmail.com
              </a>
            </p>
            <p className="text-sm text-slate-500">Thứ 2 - CN: 08:00 - 22:00</p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Tài liệu
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600">
                  Hợp đồng giao lớp
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600">
                  Hợp đồng gia sư
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600">
                  Báo cáo học tập
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600">
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600">
                  Tuyển dụng
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Tư vấn
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="text-sm text-slate-600 hover:text-blue-600">
                  Giới thiệu
                </a>
              </li>
              <li>
                <a href="/discover/tutors" className="text-sm text-slate-600 hover:text-blue-600">
                  Tìm gia sư
                </a>
              </li>
              <li>
                <a href="/discover/classes" className="text-sm text-slate-600 hover:text-blue-600">
                  Tìm lớp học
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600">
                  Hỏi đáp
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-blue-600">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Kết nối với chúng tôi
            </h4>
            <div className="mb-4 flex gap-2">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                aria-label="Facebook"
              >
                <i className="bi bi-facebook" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                aria-label="Messenger"
              >
                <i className="bi bi-messenger" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                aria-label="YouTube"
              >
                <i className="bi bi-youtube" />
              </a>
            </div>
            <a
              href="/register"
              className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Đăng lớp ngay
            </a>
          </div>
        </div>

        <hr className="my-6 border-slate-200" />
        <p className="text-center text-sm text-slate-500">
          © 2026 EduMatch Pro. All rights reserved.
        </p>
      </div>

      <div className="fixed bottom-4 right-4 flex flex-col gap-2 md:hidden">
        <a
          href="tel:0369148660"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700"
          title="Gọi"
        >
          <i className="bi bi-telephone-fill" />
        </a>
        <a
          href="#"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
          title="Chat"
        >
          <i className="bi bi-chat-dots-fill" />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
