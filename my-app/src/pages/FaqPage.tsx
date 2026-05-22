import { useState } from "react";
import heroImage from "../assets/hero.png";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

type FaqItemData = {
  question: string;
  answer: string;
};

const faqItems: FaqItemData[] = [
  {
    question: "EduMatch Pro là gì?",
    answer:
      "EduMatch Pro là nền tảng kết nối gia sư 1 kèm 1, giúp phụ huynh và học sinh tìm được gia sư phù hợp nhanh chóng, minh bạch và chuyên nghiệp. Chúng tôi hoạt động như cầu nối giữa người cần học và người dạy.",
  },
  {
    question: "Phụ huynh tìm gia sư bằng cách nào?",
    answer:
      "Phụ huynh chỉ cần đăng lớp với thông tin môn học, lịch học và yêu cầu cụ thể. EduMatch Pro sẽ hỗ trợ kết nối gia sư phù hợp trong 1-3 ngày làm việc. Phụ huynh có thể trao đổi và đánh giá mức độ phù hợp trước khi duy trì lớp học.",
  },
  {
    question: "Tìm hoặc đổi gia sư có mất phí không?",
    answer:
      "Việc tìm kiếm và tư vấn gia sư được hỗ trợ miễn phí. Nếu gia sư chưa phù hợp, phụ huynh có thể liên hệ đội ngũ tư vấn để được hỗ trợ đổi gia sư theo nhu cầu thực tế.",
  },
  {
    question: "Gia sư đăng ký nhận lớp như thế nào?",
    answer:
      "Gia sư tạo hồ sơ trên EduMatch Pro với đầy đủ thông tin cá nhân, môn dạy, học vấn, kinh nghiệm và lịch rảnh. Sau đó gia sư có thể tìm và ứng tuyển vào các lớp phù hợp với chuyên môn của mình.",
  },
  {
    question: "Học phí được tính như thế nào?",
    answer:
      "Học phí được tính theo buổi, thường dao động từ 150k - 400k/buổi tùy theo môn học, cấp độ và thời lượng. Mức phí được trình bày minh bạch để phụ huynh và gia sư thống nhất trước khi bắt đầu.",
  },
  {
    question: "Gia sư được thanh toán khi nào?",
    answer:
      "Việc thanh toán phụ thuộc vào thỏa thuận và quy trình lớp học cụ thể. EduMatch Pro ưu tiên sự minh bạch, rõ ràng giữa phụ huynh, học viên và gia sư trong toàn bộ quá trình học.",
  },
  {
    question: "Tôi có thể hủy lớp học không?",
    answer:
      "Cả phụ huynh và gia sư đều có thể gửi yêu cầu hủy lớp kèm lý do. EduMatch Pro sẽ xem xét tình huống và hỗ trợ phương án thay thế phù hợp nhất cho cả hai bên.",
  },
  {
    question: "Liên hệ tư vấn qua kênh nào?",
    answer:
      "Bạn có thể liên hệ với EduMatch Pro qua Hotline 0369 148 660, Zalo, Messenger, email edumatchpro@gmail.com hoặc gửi thông tin qua trang Liên hệ. Thời gian hỗ trợ trực tiếp: Thứ 2 - Chủ nhật, 08:00 - 22:00.",
  },
];

function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sky-50/30 text-slate-900">
      <Navbar />

      <main className="flex-1 overflow-hidden">
        <Hero />
        <FaqSection />
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
        <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Câu hỏi thường gặp
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Giải đáp những thắc mắc phổ biến về việc tìm gia sư, đăng lớp, học phí và quy trình
          kết nối tại EduMatch Pro.
        </p>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 shadow-sm">
            <div className="text-lg font-bold text-blue-700">8+</div>
            <div className="mt-1 text-xs font-medium text-slate-500">Câu hỏi phổ biến</div>
          </div>
          <div className="rounded-lg border border-cyan-100 bg-cyan-50/80 px-4 py-3 shadow-sm">
            <div className="text-lg font-bold text-cyan-700">1-3 ngày</div>
            <div className="mt-1 text-xs font-medium text-slate-500">Kết nối phù hợp</div>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-4 py-3 shadow-sm">
            <div className="text-lg font-bold text-emerald-700">Miễn phí</div>
            <div className="mt-1 text-xs font-medium text-slate-500">Tư vấn ban đầu</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-gradient-to-b from-white via-sky-50/70 to-white py-16 lg:py-24">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
            Trung tâm hỗ trợ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Những điều bạn thường hỏi
          </h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
          {faqItems.map((item, index) => (
            <FaqArticle
              key={item.question}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqArticle({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItemData;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="border-b border-blue-50 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-blue-50/50 sm:px-8"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-base font-bold leading-7 text-slate-950 sm:text-lg">
          {item.question}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-bold transition ${
            isOpen ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-700"
          }`}
        >
          {isOpen ? "-" : "+"}
        </span>
      </button>
      {isOpen ? (
        <div className="px-5 pb-6 text-base leading-7 text-slate-600 sm:px-8">{item.answer}</div>
      ) : null}
    </article>
  );
}

function Cta() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 px-6 py-14 text-center shadow-sm sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_30%)]" />
        <div className="relative flex flex-col items-center">
          <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
            Chưa tìm thấy câu trả lời?
          </h2>
          <p className="mt-4 w-full max-w-2xl text-center text-base leading-7 text-slate-600">
            Liên hệ ngay với chúng tôi để được tư vấn trực tiếp.
          </p>
          <a
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold leading-tight text-white shadow-sm transition hover:bg-blue-800"
          >
            Liên hệ tư vấn
          </a>
        </div>
      </div>
    </section>
  );
}

export default FaqPage;
