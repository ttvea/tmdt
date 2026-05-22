import type React from "react";
import { useState } from "react";
import heroImage from "../assets/hero.png";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

type IconProps = {
  className?: string;
};

type ContactItem = {
  title: string;
  value: string;
  href?: string;
  icon: (props: IconProps) => React.ReactElement;
  tint: string;
  iconColor: string;
};

type FormFieldProps = {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
};

const contactItems: ContactItem[] = [
  {
    title: "Địa chỉ",
    value: "Khu phố 33, phường Linh Xuân, TP. Hồ Chí Minh",
    icon: MapPinIcon,
    tint: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-700",
  },
  {
    title: "Hotline",
    value: "0369 148 660",
    href: "tel:0369148660",
    icon: PhoneIcon,
    tint: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-700",
  },
  {
    title: "Email",
    value: "edumatchpro@gmail.com",
    href: "mailto:edumatchpro.vn@gmail.com",
    icon: MailIcon,
    tint: "bg-cyan-50 border-cyan-100",
    iconColor: "text-cyan-700",
  },
  {
    title: "Giờ làm việc",
    value: "Thứ 2 - Chủ nhật: 08:00 - 22:00",
    icon: ClockIcon,
    tint: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-700",
  },
];

function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-sky-50/30 text-slate-900">
      <Navbar />

      <main className="flex-1 overflow-hidden">
        <Hero />
        <ContactSection />
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
          Liên hệ với chúng tôi
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Đội ngũ EduMatch Pro luôn sẵn sàng hỗ trợ phụ huynh, học viên và gia sư trong
          quá trình kết nối lớp học.
        </p>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 shadow-sm">
            <div className="text-lg font-bold text-blue-700">24/7</div>
            <div className="mt-1 text-xs font-medium text-slate-500">Tiếp nhận yêu cầu</div>
          </div>
          <div className="rounded-lg border border-cyan-100 bg-cyan-50/80 px-4 py-3 shadow-sm">
            <div className="text-lg font-bold text-cyan-700">08:00 - 22:00</div>
            <div className="mt-1 text-xs font-medium text-slate-500">Tư vấn trực tiếp</div>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-4 py-3 shadow-sm">
            <div className="text-lg font-bold text-emerald-700">Miễn phí</div>
            <div className="mt-1 text-xs font-medium text-slate-500">Hỗ trợ tìm gia sư</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="bg-gradient-to-b from-white via-sky-50/70 to-white py-16 lg:py-24">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.82fr_1fr] lg:gap-12 lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
            Thông tin liên hệ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Kết nối nhanh với EduMatch Pro
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Bạn cần tư vấn học phí, tìm gia sư, đăng lớp hoặc hỗ trợ tài khoản? Gửi thông tin
            cho chúng tôi, đội ngũ tư vấn sẽ phản hồi sớm nhất.
          </p>

          <div className="mt-8 grid gap-5">
            {contactItems.map((item) => (
              <ContactInfo key={item.title} {...item} />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="tel:0369148660"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              <PhoneIcon className="h-4 w-4" />
              Gọi ngay
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
            >
              <ChatIcon className="h-4 w-4" />
              Zalo
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
            >
              <MessengerIcon className="h-4 w-4" />
              Messenger
            </a>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}

function ContactInfo({ title, value, href, icon: Icon, tint, iconColor }: ContactItem) {
  const content = (
    <>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tint}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <div className="font-semibold text-slate-950">{title}</div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{value}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {content}
    </div>
  );
}

function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <MailIcon className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-slate-950">Gửi tin nhắn cho chúng tôi</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Điền thông tin bên dưới để EduMatch Pro có thể hỗ trợ đúng nhu cầu của bạn.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Họ tên" id="name" placeholder="Nguyễn Văn A" autoComplete="name" />
          <FormField
            label="Số điện thoại"
            id="phone"
            type="tel"
            placeholder="0912 345 678"
            autoComplete="tel"
          />
        </div>
        <FormField
          label="Email"
          id="email"
          type="email"
          placeholder="email@example.com"
          autoComplete="email"
        />

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900" htmlFor="role">
            Bạn là?
          </label>
          <select
            id="role"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option>Phụ huynh / Học sinh</option>
            <option>Gia sư</option>
            <option>Khác</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900" htmlFor="message">
            Nội dung
          </label>
          <textarea
            id="message"
            className="min-h-32 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            rows={4}
            placeholder="Nhập nội dung tin nhắn..."
          />
        </div>

        {submitted ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Cảm ơn bạn. Tin nhắn đã được ghi nhận trên giao diện mẫu.
          </div>
        ) : null}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          Gửi tin nhắn
        </button>
      </form>
    </section>
  );
}

function FormField({ label, id, type = "text", placeholder, autoComplete }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-900" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
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

function MapPinIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </IconBase>
  );
}

function PhoneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.8a2 2 0 0 1-.45 2.11L8.05 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.31 1.84.53 2.8.66A2 2 0 0 1 22 16.92Z" />
    </IconBase>
  );
}

function MailIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </IconBase>
  );
}

function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </IconBase>
  );
}

function ChatIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </IconBase>
  );
}

function MessengerIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 11.5a8.5 8.5 0 1 1-16.5-3 8.5 8.5 0 0 1 16.5 3Z" />
      <path d="m8 13 2.6-2.6 2.5 2.1L16 9" />
    </IconBase>
  );
}

export default ContactPage;
