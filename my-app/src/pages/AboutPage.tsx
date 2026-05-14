import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

type ValueCard = {
  title: string;
  description: string;
  icon: string;
  colorClass: string;
};

const stats = [
  { value: "5000+", label: "Lớp học đã kết nối" },
  { value: "3000+", label: "Gia sư đã đăng ký" },
  { value: "95%", label: "Phụ huynh hài lòng" },
];

const values: ValueCard[] = [
  {
    title: "Minh bạch",
    description:
      "Mọi thông tin về học phí, hợp đồng và chính sách đều được trình bày rõ ràng ngay từ đầu.",
    icon: "bi-shield-check",
    colorClass:
      "from-amber-50 to-white text-amber-700 border-amber-100",
  },
  {
    title: "Tận tâm",
    description:
      "Đội ngũ tư vấn theo sát từng nhu cầu học tập, từ lúc tìm gia sư đến khi lớp vận hành ổn định.",
    icon: "bi-heart-pulse",
    colorClass:
      "from-sky-50 to-white text-sky-700 border-sky-100",
  },
  {
    title: "Chất lượng",
    description:
      "Gia sư được kiểm duyệt về chuyên môn, tác phong và khả năng đồng hành cùng học sinh.",
    icon: "bi-stars",
    colorClass:
      "from-emerald-50 to-white text-emerald-700 border-emerald-100",
  },
  {
    title: "Đổi mới",
    description:
      "Quy trình kết nối được cải tiến liên tục để việc học 1 kèm 1 trở nên dễ tiếp cận và hiệu quả hơn.",
    icon: "bi-lightning-charge",
    colorClass:
      "from-rose-50 to-white text-rose-700 border-rose-100",
  },
];

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex-1 overflow-hidden">
        {/* HERO */}
        <section className="relative isolate flex min-h-[520px] items-center justify-center overflow-hidden bg-slate-950">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-blue-500/20 blur-3xl" />

            <div className="absolute bottom-[-120px] right-[-120px] h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
          </div>

          {/* Content */}
          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-14 text-center lg:py-16">
            <h1 className="max-w-4xl text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-white">
                Câu chuyện phát triển của
              </span>{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                EduMatch Pro
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              Chúng tôi xây dựng nền tảng kết nối gia sư hiện đại,
              minh bạch và hiệu quả để mỗi học sinh đều có cơ hội
              phát triển tốt nhất.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition duration-300 hover:-translate-y-1 hover:bg-blue-500"
              >
                Bắt đầu ngay
              </a>

              <a
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:bg-white/10"
              >
                Khám phá gia sư
              </a>
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />

          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
                  Sứ mệnh
                </p>

                <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950">
                  Kết nối đúng người học với đúng gia sư
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-slate-600">
                  <p>
                    EduMatch Pro được xây dựng với mục tiêu giúp phụ
                    huynh dễ dàng tìm được gia sư phù hợp và giúp
                    gia sư tiếp cận lớp học chất lượng nhanh hơn.
                  </p>

                  <p>
                    Chúng tôi tin rằng trải nghiệm học tập hiệu quả
                    phải bắt đầu từ sự thấu hiểu, minh bạch và đồng
                    hành lâu dài.
                  </p>
                </div>
              </div>

              {/* Commitment Card */}
              <aside className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-100 blur-3xl" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg shadow-blue-600/30">
                    <i className="bi bi-award" />
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-slate-950">
                    Cam kết của chúng tôi
                  </h3>

                  <div className="mt-8 space-y-5">
                    {[
                      "Tư vấn đúng nhu cầu học tập",
                      "Gia sư được xác minh thông tin",
                      "Theo dõi chất lượng trong quá trình học",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-4"
                      >
                        <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <i className="bi bi-check-lg text-sm" />
                        </div>

                        <p className="text-sm font-medium leading-6 text-slate-700">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            {/* Stats */}
            <div className="mt-20 grid gap-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="text-5xl font-black text-blue-700">
                    {stat.value}
                  </div>

                  <div className="mt-3 text-sm font-medium text-slate-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="relative border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
                Giá trị cốt lõi
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                Điều tạo nên sự khác biệt của EduMatch Pro
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {values.map((value) => (
                <article
                  key={value.title}
                  className={`group rounded-3xl border bg-gradient-to-br p-8 transition duration-300 hover:-translate-y-2 hover:shadow-xl ${value.colorClass}`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm transition group-hover:scale-110">
                    <i className={`bi ${value.icon}`} />
                  </div>

                  <h3 className="mt-6 text-2xl font-bold text-slate-950">
                    {value.title}
                  </h3>

                  <p className="mt-4 text-base leading-7 text-slate-600">
                    {value.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative flex min-h-[500px] items-center justify-center overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500" />

          {/* Content */}
          <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
            <div className="w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-10 text-center text-white backdrop-blur-xl shadow-2xl lg:p-14">
              <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Hãy đồng hành cùng EduMatch Pro
              </h2>

              <div className="mt-6 flex justify-center">
                <p className="max-w-2xl text-center text-lg leading-8 text-blue-100 sm:text-xl">
                  Dù bạn là phụ huynh đang tìm gia sư hay gia sư muốn nhận lớp
                  nghiêm túc, chúng tôi luôn sẵn sàng kết nối.
                </p>
              </div>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-7 py-3 text-sm font-bold text-blue-700 transition duration-300 hover:-translate-y-1 hover:bg-blue-50"
                >
                  Đăng ký ngay
                </a>

                <a
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/10"
                >
                  Khám phá gia sư
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AboutPage;