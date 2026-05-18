import Navbar from "../layouts/Navbar";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-50 via-slate-50 to-white text-slate-900">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <section className="w-full max-w-xl rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">404</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Trang chưa được tạo</h1>
          <p className="mt-3 text-slate-600">
            Đường dẫn này chưa có giao diện hoặc chưa được cấu hình trong hệ thống.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/"
              className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Về trang chủ
            </a>
            <a
              href="/discover/tutors"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Khám phá gia sư
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default NotFoundPage;
