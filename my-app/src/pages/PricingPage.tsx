import type React from "react";
import heroImage from "../assets/hero.png";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

type IconProps = {
  className?: string;
};

type PricingCardData = {
  title: string;
  icon: (props: IconProps) => React.ReactElement;
  subjects: string;
  price: string;
  duration: string;
  accentClass: string;
  cardClass: string;
  iconClass: string;
  priceClass: string;
  badgeClass?: string;
  featured?: boolean;
};

const pricingCards: PricingCardData[] = [
  {
    title: "Phổ thông",
    icon: BookIcon,
    subjects:
      "Toán, Tiếng Việt, Luyện chữ, Vật lý, Hóa học, Ngữ Văn, Lịch sử, Địa lý, Sinh học, Tin học",
    price: "150k - 300k",
    duration: "/ buổi (90-120 phút)",
    accentClass: "bg-blue-50 text-blue-700 ring-blue-100",
    cardClass: "border-blue-100 bg-blue-50/50 hover:border-blue-200 hover:shadow-md",
    iconClass: "bg-blue-600 text-white shadow-sm",
    priceClass: "text-blue-700",
  },
  {
    title: "Ngoại ngữ",
    icon: GlobeIcon,
    subjects:
      "Tiếng Anh, Tiếng Trung, Tiếng Nhật, Tiếng Pháp, Tiếng Nga, Tiếng Hàn, Tiếng Đức",
    price: "180k - 350k",
    duration: "/ buổi (90-120 phút)",
    accentClass: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    cardClass:
      "border-cyan-300 bg-gradient-to-b from-cyan-50 via-white to-white shadow-lg ring-1 ring-cyan-100",
    iconClass: "bg-cyan-600 text-white shadow-sm",
    priceClass: "text-cyan-700",
    badgeClass: "bg-cyan-600 text-white",
    featured: true,
  },
  {
    title: "Năng khiếu",
    icon: MusicIcon,
    subjects: "Âm nhạc, Piano, Organ, Guitar, Sáo, Vẽ, Cờ vua, Cờ tướng",
    price: "200k - 400k",
    duration: "/ buổi (60-90 phút)",
    accentClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    cardClass: "border-emerald-100 bg-emerald-50/50 hover:border-emerald-200 hover:shadow-md",
    iconClass: "bg-emerald-600 text-white shadow-sm",
    priceClass: "text-emerald-700",
  },
];

const comparisonRows = [
  ["Toán học", "Tiểu học - THPT", "150k - 250k", "90 - 120 phút"],
  ["Tiếng Việt / Luyện chữ", "Tiểu học", "150k - 200k", "90 - 120 phút"],
  ["Vật lý / Hóa học", "THCS - THPT", "180k - 300k", "90 - 120 phút"],
  ["Ngữ Văn", "THCS - THPT", "180k - 250k", "90 - 120 phút"],
  ["Tiếng Anh", "Mọi cấp độ", "180k - 350k", "90 - 120 phút"],
  ["Tiếng Trung / Nhật / Hàn", "Mọi cấp độ", "200k - 350k", "90 - 120 phút"],
  ["Piano / Guitar", "Cơ bản - Nâng cao", "250k - 400k", "60 - 90 phút"],
  ["Vẽ / Hội họa", "Cơ bản - Nâng cao", "200k - 300k", "60 - 90 phút"],
  ["Cờ vua / Cờ tướng", "Cơ bản - Nâng cao", "200k - 300k", "60 - 90 phút"],
];

function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sky-50/30 text-ink">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <PricingSection />
        <Cta />
      </main>

      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      <img
        src={heroImage}
        alt=""
        aria-hidden="true"
        className="absolute right-0 top-0 hidden h-full w-1/2 object-cover opacity-10 lg:block"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.10),transparent_30%)]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Bảng học phí tham khảo
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Học phí được công khai rõ ràng theo từng nhóm môn. Liên hệ để được tư vấn mức phí phù
            hợp nhất.
          </p>
        </div>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 shadow-sm">
            <div className="text-lg font-bold text-blue-700">150k+</div>
            <div className="mt-1 text-xs font-medium text-slate-500">Học phí từ mỗi buổi</div>
          </div>
          <div className="rounded-lg border border-cyan-100 bg-cyan-50/80 px-4 py-3 shadow-sm">
            <div className="text-lg font-bold text-cyan-700">60-120 phút</div>
            <div className="mt-1 text-xs font-medium text-slate-500">Thời lượng linh hoạt</div>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-4 py-3 shadow-sm">
            <div className="text-lg font-bold text-emerald-700">Miễn phí</div>
            <div className="mt-1 text-xs font-medium text-slate-500">Tư vấn mức phí phù hợp</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="bg-gradient-to-b from-white via-sky-50/70 to-white py-16 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {pricingCards.map((card) => (
            <PricingCard key={card.title} {...card} />
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-2xl text-center lg:mt-24">
          <h2 className="text-3xl font-semibold text-ink sm:text-4xl">So sánh chi tiết</h2>
          <p className="mt-3 text-base leading-7 text-slate">
            Tham khảo mức học phí theo từng môn học, cấp độ và thời lượng mỗi buổi.
          </p>
        </div>
        <ComparisonTable />
      </div>
    </section>
  );
}

function PricingCard({
  title,
  subjects,
  price,
  duration,
  featured,
  icon: Icon,
  accentClass,
  cardClass,
  iconClass,
  priceClass,
  badgeClass = "bg-blue-700 text-white",
}: PricingCardData) {
  return (
    <article
      className={`relative overflow-hidden rounded-xl border p-8 transition hover:-translate-y-0.5 ${cardClass}`}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-white/60" />
      {featured ? (
        <span
          className={`relative inline-flex rounded-full px-3 py-1 text-[13px] font-semibold ${badgeClass}`}
        >
          Phổ biến nhất
        </span>
      ) : null}
      <div
        className={`${featured ? "mt-5" : ""} mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-7 w-7" />
      </div>
      <span
        className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${accentClass}`}
      >
        Gia sư 1 kèm 1
      </span>
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 min-h-24 text-sm leading-6 text-slate">{subjects}</p>
      <div className={`mt-4 text-3xl font-semibold ${priceClass}`}>{price}</div>
      <span className="mt-2 block text-sm text-slate">{duration}</span>
    </article>
  );
}

function ComparisonTable() {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-blue-700 text-white">
            <tr>
              {["Môn học", "Cấp độ", "Học phí / buổi", "Thời lượng"].map((heading) => (
                <th key={heading} className="border-b border-blue-600 px-6 py-4 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map(([subject, level, price, duration]) => (
              <tr
                key={subject}
                className="border-b border-blue-50 transition last:border-b-0 hover:bg-sky-50/70"
              >
                <td className="px-6 py-4 font-medium text-slate-950">{subject}</td>
                <td className="px-6 py-4 text-slate">{level}</td>
                <td className="px-6 py-4 font-semibold text-blue-700">{price}</td>
                <td className="px-6 py-4 font-medium text-emerald-700">{duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cta() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 px-6 py-14 text-center shadow-sm sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_30%)]" />
        <div className="relative flex flex-col items-center">
        <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
          Bạn cần tư vấn học phí phù hợp?
        </h2>
        <p className="mt-4 w-full max-w-2xl text-center text-base leading-7 text-slate-600">
          Đăng lớp ngay để được tư vấn miễn phí và kết nối gia sư phù hợp.
        </p>
        <a
          href="/register"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold leading-tight text-white shadow-sm transition hover:bg-blue-800"
        >
          Đăng lớp ngay
        </a>
        </div>
      </div>
    </section>
  );
}

function IconBase({ children, className = "" }: React.PropsWithChildren<IconProps>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function BookIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
    </IconBase>
  );
}

function GlobeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 0 20" />
      <path d="M12 2a15.3 15.3 0 0 0 0 20" />
    </IconBase>
  );
}

function MusicIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </IconBase>
  );
}

export default PricingPage;
