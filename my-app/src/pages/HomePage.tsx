import heroImage from "../assets/hero.png";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

type Step = {
  title: string;
  description: string;
};

const studentSteps: Step[] = [
  {
    title: "Tìm kiếm thông minh",
    description:
      "Lọc theo môn học, cấp học, nghề nghiệp gia sư và trạng thái xác thực hồ sơ.",
  },
  {
    title: "So sánh hồ sơ",
    description:
      "Xem chuyên môn, kinh nghiệm, môn dạy và giới thiệu của từng gia sư trước khi liên hệ.",
  },
  {
    title: "Kết nối nhanh",
    description:
      "Nhận đề xuất phù hợp và chốt lịch học thử nhanh chóng theo nhu cầu thực tế.",
  },
];

const tutorSteps: Step[] = [
  {
    title: "Cập nhật hồ sơ",
    description:
      "Điền đầy đủ nghề nghiệp, học vấn, kinh nghiệm, môn dạy và thông tin giới thiệu.",
  },
  {
    title: "Xuất hiện trên tìm kiếm",
    description:
      "Hồ sơ được hiển thị để phụ huynh và học viên tìm kiếm theo bộ lọc phù hợp.",
  },
  {
    title: "Nhận lớp phù hợp",
    description:
      "Ứng tuyển lớp hoặc nhận liên hệ trực tiếp từ nhu cầu học tập phù hợp chuyên môn.",
  },
];

function ProcessCard({
  title,
  steps,
  accentClass,
}: {
  title: string;
  steps: Step[];
  accentClass: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="mb-6 text-xl font-semibold text-slate-950">{title}</h3>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.title} className="flex gap-4">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${accentClass}`}
            >
              {index + 1}
            </span>
            <div>
              <h4 className="mb-1 font-semibold text-slate-900">{step.title}</h4>
              <p className="text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function HomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-sky-50/40 text-left text-slate-900">
      <Navbar />

      <main className="w-full flex-1">
        <section className="relative w-full overflow-hidden bg-white">
          <img
            src={heroImage}
            alt="Học viên đang học cùng gia sư"
            className="absolute right-0 top-0 hidden h-full w-1/2 object-cover opacity-10 lg:block"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.10),transparent_30%)]" />

          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              EduMatch Pro - Kết nối gia sư 1 kèm 1
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Giúp phụ huynh, học viên và gia sư gặp đúng nhu cầu, đúng chuyên môn và đúng
              lịch học.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/discover/tutors"
                className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Khám phá gia sư
              </a>
              <a
                href="/discover/classes"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Tìm lớp học
              </a>
            </div>
            <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
                <div className="text-lg font-bold text-blue-700">1-3 ngày</div>
                <div className="mt-1 text-xs font-medium text-slate-500">Kết nối phù hợp</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
                <div className="text-lg font-bold text-cyan-700">Miễn phí</div>
                <div className="mt-1 text-xs font-medium text-slate-500">Tìm và đổi gia sư</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
                <div className="text-lg font-bold text-emerald-700">1 kèm 1</div>
                <div className="mt-1 text-xs font-medium text-slate-500">Theo sát mục tiêu</div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-white py-16">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            <article className="rounded-2xl border border-slate-200 bg-rose-50 p-6">
              <h3 className="text-lg font-bold text-slate-900">Tìm & đổi gia sư miễn phí</h3>
              <p className="mt-2 text-sm text-slate-600">
                Không mất phí tìm hoặc đổi gia sư. Học thử 1 buổi miễn phí để đảm bảo phù hợp.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-sky-50 p-6">
              <h3 className="text-lg font-bold text-slate-900">Học phí minh bạch</h3>
              <p className="mt-2 text-sm text-slate-600">
                Bảng giá rõ ràng theo từng môn học, cấp lớp và hình thức học.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-emerald-50 p-6">
              <h3 className="text-lg font-bold text-slate-900">Kết nối nhanh 1-3 ngày</h3>
              <p className="mt-2 text-sm text-slate-600">
                Nhận đề xuất gia sư phù hợp nhanh chóng theo đúng nhu cầu học tập.
              </p>
            </article>
          </div>
        </section>

        <section className="w-full border-y border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Cách nền tảng hoạt động
              </h2>
              <p className="mt-3 text-slate-600">
                Quy trình đơn giản để phụ huynh, học viên và gia sư kết nối hiệu quả.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ProcessCard
                title="Dành cho phụ huynh & học viên"
                steps={studentSteps}
                accentClass="bg-blue-100 text-blue-700"
              />
              <ProcessCard
                title="Dành cho gia sư"
                steps={tutorSteps}
                accentClass="bg-cyan-100 text-cyan-800"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 px-6 py-10 text-center shadow-sm">
            <h2 className="max-w-3xl text-center text-3xl font-bold text-slate-950">
              Sẵn sàng tìm gia sư phù hợp?
            </h2>
            <p className="mt-3 max-w-2xl text-center text-slate-600">
              Đăng lớp ngay hôm nay - miễn phí tìm & đổi gia sư, tặng 1 buổi học thử.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="/register"
                className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Đăng lớp ngay
              </a>
              <a
                href="/about"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tìm hiểu thêm
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
