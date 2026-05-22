import { useEffect, useState } from "react";
import { getCategories } from "../api/category";
import { searchClassesPaged } from "../api/classApi";
import { searchTutorProfilesPaged } from "../api/tutorProfile";
import heroImage from "../assets/hero.png";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

type ValueCard = {
  title: string;
  description: string;
  icon: string;
  colorClass: string;
};

const values: ValueCard[] = [
  {
    title: "Minh bạch",
    description:
      "Mọi thông tin về học phí, hợp đồng và chính sách đều được trình bày rõ ràng ngay từ đầu.",
    icon: "bi-shield-check",
    colorClass: "border-amber-100 bg-amber-50 text-amber-700",
  },
  {
    title: "Tận tâm",
    description:
      "Đội ngũ tư vấn theo sát từng nhu cầu học tập, từ lúc tìm gia sư đến khi lớp vận hành ổn định.",
    icon: "bi-heart-pulse",
    colorClass: "border-sky-100 bg-sky-50 text-sky-700",
  },
  {
    title: "Chất lượng",
    description:
      "Gia sư được kiểm duyệt về chuyên môn, tác phong và khả năng đồng hành cùng học sinh.",
    icon: "bi-stars",
    colorClass: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  {
    title: "Đổi mới",
    description:
      "Quy trình kết nối được cải tiến liên tục để việc học 1 kèm 1 trở nên dễ tiếp cận và hiệu quả hơn.",
    icon: "bi-lightning-charge",
    colorClass: "border-rose-100 bg-rose-50 text-rose-700",
  },
];

const initialStats = [
  { value: "...", label: "Lớp học đang mở" },
  { value: "...", label: "Gia sư trên hệ thống" },
  { value: "...", label: "Môn học hỗ trợ" },
];

function formatStat(value: number) {
  return value.toLocaleString("vi-VN");
}

function AboutPage() {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    async function loadStats() {
      try {
        const [classesPage, tutorsPage, categories] = await Promise.all([
          searchClassesPaged({ page: 0, size: 1 }),
          searchTutorProfilesPaged({ page: 0, size: 1 }),
          getCategories(),
        ]);

        const subjectCount = categories.reduce((total, category) => {
          return total + category.subjects.length;
        }, 0);

        setStats([
          { value: formatStat(classesPage.totalElements), label: "Lớp học đang mở" },
          { value: formatStat(tutorsPage.totalElements), label: "Gia sư trên hệ thống" },
          { value: formatStat(subjectCount), label: "Môn học hỗ trợ" },
        ]);
      } catch {
        setStats([
          { value: "0", label: "Lớp học đang mở" },
          { value: "0", label: "Gia sư trên hệ thống" },
          { value: "0", label: "Môn học hỗ trợ" },
        ]);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-sky-50/30 text-slate-900">
      <Navbar />

      <main className="flex-1 overflow-hidden">
        <section className="relative isolate overflow-hidden border-b border-slate-200 bg-white">
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 hidden h-full w-1/2 object-cover opacity-10 lg:block"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.10),transparent_30%)]" />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Câu chuyện phát triển của EduMatch Pro
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Chúng tôi xây dựng nền tảng kết nối gia sư hiện đại, minh bạch và hiệu quả
              để mỗi học sinh đều có cơ hội phát triển tốt nhất.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/register"
                className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Bắt đầu ngay
              </a>

              <a
                href="/discover/tutors"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Khám phá gia sư
              </a>
            </div>

            <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map((item, index) => (
                <div
                  key={item.label}
                  className={`rounded-lg border px-4 py-3 shadow-sm ${index === 0
                      ? "border-blue-100 bg-blue-50/80"
                      : index === 1
                        ? "border-cyan-100 bg-cyan-50/80"
                        : "border-emerald-100 bg-emerald-50/80"
                    }`}
                >
                  <div
                    className={`text-lg font-bold ${index === 0
                        ? "text-blue-700"
                        : index === 1
                          ? "text-cyan-700"
                          : "text-emerald-700"
                      }`}
                  >
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
                  Sứ mệnh
                </p>

                <h2 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-950">
                  Kết nối đúng người học với đúng gia sư
                </h2>

                <div className="mt-8 space-y-5 text-lg leading-8 text-slate-600">
                  <p>
                    EduMatch Pro được xây dựng với mục tiêu giúp phụ huynh dễ dàng tìm
                    được gia sư phù hợp và giúp gia sư tiếp cận lớp học chất lượng nhanh hơn.
                  </p>

                  <p>
                    Chúng tôi tin rằng trải nghiệm học tập hiệu quả phải bắt đầu từ sự
                    thấu hiểu, minh bạch và đồng hành lâu dài.
                  </p>
                </div>
              </div>

              <aside className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-950">Cam kết của chúng tôi</h3>
                <div className="mt-6 space-y-4">
                  {[
                    "Tư vấn nhu cầu học tập trước khi kết nối.",
                    "Ưu tiên hồ sơ rõ ràng, chuyên môn phù hợp.",
                    "Theo dõi phản hồi để lớp học vận hành ổn định.",
                  ].map((item) => (
                    <div key={item} className="flex gap-3">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        ✓
                      </span>
                      <p className="text-sm leading-6 text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Giá trị vận hành
              </h2>
              <p className="mt-3 text-slate-600">
                Những nguyên tắc giúp EduMatch Pro giữ chất lượng trong từng kết nối.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value) => (
                <article
                  key={value.title}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg border text-xl ${value.colorClass}`}
                  >
                    <i className={`bi ${value.icon}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950">{value.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{value.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 px-6 py-10 text-center shadow-sm">
            <h2 className="max-w-3xl text-center text-3xl font-bold text-slate-950">
              Cùng bắt đầu một lớp học hiệu quả hơn
            </h2>
            <p className="mt-3 max-w-2xl text-center text-slate-600">
              Dù bạn là phụ huynh đang tìm gia sư hay gia sư muốn nhận lớp, EduMatch Pro
              giúp quá trình kết nối rõ ràng và nhanh hơn.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="/register"
                className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Đăng ký ngay
              </a>
              <a
                href="/discover/classes"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Xem lớp học
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AboutPage;
