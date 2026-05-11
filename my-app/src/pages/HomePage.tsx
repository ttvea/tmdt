import { useEffect, useMemo, useState } from "react";
import heroImage from "../assets/hero.png";
import { getCategories, type GradeLevel, type SubjectCategory } from "../api/category";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

type Tutor = {
  id: number;
  name: string;
  subject: string;
  rating: number;
  reviews: number;
  price: number;
  description: string;
  avatar: string;
  tags: string[];
  verified: boolean;
};

type Step = {
  title: string;
  description: string;
};

const tutors: Tutor[] = [
  {
    id: 1,
    name: "Dr. Sarah Jenkins",
    subject: "Toán cao cấp",
    rating: 4.9,
    reviews: 124,
    price: 45,
    description:
      "Tiến sĩ Toán học, chuyên về giải tích, đại số và luyện thi chuẩn hóa. Các khái niệm khó được giải thích bằng cách dễ hiểu.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    tags: ["Giải tích", "Luyện thi SAT"],
    verified: true,
  },
  {
    id: 2,
    name: "Michael Chen",
    subject: "Vật lý & Kỹ thuật",
    rating: 4.8,
    reviews: 89,
    price: 40,
    description:
      "Cựu trợ giảng đại học, tập trung vào cơ học và nhiệt động lực học với phương pháp giải quyết vấn đề thực tế.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    tags: ["Vật lý", "Cơ học"],
    verified: true,
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    subject: "Văn học & Viết lách",
    rating: 5,
    reviews: 210,
    price: 35,
    description:
      "Nhà tiểu luận giúp học sinh làm chủ kỹ năng viết học thuật, phân tích văn học và bài luận tuyển sinh đại học.",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80",
    tags: ["Viết luận", "Văn học Anh"],
    verified: true,
  },
];

const studentSteps: Step[] = [
  {
    title: "Tìm kiếm & so sánh",
    description:
      "Duyệt hồ sơ gia sư, đọc đánh giá đã xác minh và so sánh mức giá để tìm người phù hợp nhất.",
  },
  {
    title: "Đặt lịch học",
    description:
      "Lên lịch vào thời gian thuận tiện với hệ thống đặt lịch rõ ràng, dễ theo dõi.",
  },
  {
    title: "Học hỏi & phát triển",
    description:
      "Tham gia buổi học trực tuyến hoặc trực tiếp và theo dõi tiến bộ qua từng mục tiêu học tập.",
  },
];

const tutorSteps: Step[] = [
  {
    title: "Tạo hồ sơ",
    description:
      "Nêu bật chuyên môn, thiết lập mức giá riêng và cập nhật lịch dạy khả dụng.",
  },
  {
    title: "Kết nối học viên",
    description:
      "Nhận yêu cầu đặt lịch từ học viên đang tìm kiếm đúng kỹ năng bạn có.",
  },
  {
    title: "Dạy & nhận thanh toán",
    description:
      "Cung cấp buổi học chất lượng và nhận thanh toán minh bạch, đúng hạn.",
  },
];

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.32a1 1 0 0 1-1.42.002L3.29 9.226A1 1 0 1 1 4.71 7.82l4.04 4.084 6.54-6.608a1 1 0 0 1 1.414-.006Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-amber-400"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.17 3.602a1 1 0 0 0 .95.69h3.787c.969 0 1.371 1.24.588 1.81l-3.064 2.226a1 1 0 0 0-.364 1.118l1.17 3.602c.3.921-.755 1.688-1.538 1.118l-3.064-2.226a1 1 0 0 0-1.176 0l-3.064 2.226c-.783.57-1.838-.197-1.538-1.118l1.17-3.602a1 1 0 0 0-.364-1.118L2.55 9.029c-.783-.57-.38-1.81.588-1.81h3.787a1 1 0 0 0 .95-.69l1.174-3.602Z" />
    </svg>
  );
}

function TutorCard({ tutor }: { tutor: Tutor }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="mb-4 flex items-start gap-4">
        <img
          src={tutor.avatar}
          alt={tutor.name}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100"
        />

        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">{tutor.name}</h3>
            {tutor.verified ? (
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700"
                title="Đã xác minh"
              >
                <CheckIcon />
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-500">{tutor.subject}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
        <div className="flex items-center gap-1">
          <StarIcon />
          <span className="font-semibold">{tutor.rating.toFixed(1)}</span>
          <span className="text-slate-400">({tutor.reviews} đánh giá)</span>
        </div>
        <span className="h-1 w-1 rounded-full bg-slate-300" />
        <span className="font-semibold">${tutor.price}/giờ</span>
      </div>

      <p className="mb-6 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
        {tutor.description}
      </p>

      <div className="mt-auto flex flex-wrap gap-2">
        {tutor.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

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
  const [categories, setCategories] = useState<SubjectCategory[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState<string>("");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const gradeLevelOptions: GradeLevel[] = useMemo(() => {
    if (!selectedSubjectId) {
      return [];
    }

    for (const category of categories) {
      const selectedSubject = category.subjects.find(
        (subject) => String(subject.id) === selectedSubjectId
      );

      if (selectedSubject) {
        return selectedSubject.gradeLevels;
      }
    }

    return [];
  }, [categories, selectedSubjectId]);

  useEffect(() => {
    setSelectedGradeLevelId("");
  }, [selectedSubjectId]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 text-left text-slate-900">
      <Navbar />

      <main className="w-full flex-1">
        <section className="relative w-full overflow-hidden bg-white">
          <img
            src={heroImage}
            alt="Học viên đang học cùng gia sư"
            className="absolute inset-0 h-full w-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white" />

          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Gia sư chuyên gia cho hành trình học tập của bạn
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Kết nối với các nhà giáo dục hàng đầu và làm chủ từng môn học bằng
              lộ trình phù hợp với mục tiêu cá nhân.
            </p>

            <form className="mt-10 flex w-full max-w-4xl flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-xl sm:p-6 md:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Tìm lớp học hoặc gia sư</span>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Tìm lớp học hoặc gia sư..."
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="md:w-40">
                <span className="sr-only">Chọn môn học</span>
                <select
                  value={selectedSubjectId}
                  onChange={(event) => setSelectedSubjectId(event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="" disabled hidden>
                    Chọn môn học
                  </option>
                  {categories.map((category) => (
                    <optgroup key={category.id} label={category.name}>
                      {category.subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <label className="md:w-40">
                <span className="sr-only">Chọn cấp học</span>
                <select
                  value={selectedGradeLevelId}
                  onChange={(event) => setSelectedGradeLevelId(event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="" disabled hidden>
                    Chọn cấp học
                  </option>
                  {gradeLevelOptions.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                Tìm kiếm
                <ArrowRightIcon />
              </button>
            </form>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Gia sư nổi bật
              </h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                Những nhà giáo dục được đánh giá cao, sẵn sàng giúp bạn tiến bộ.
              </p>
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              Xem tất cả
              <ArrowRightIcon />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        </section>

        <section className="w-full border-y border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Cách EduMatch Pro hoạt động
              </h2>
              <p className="mt-3 text-slate-600">
                Một quy trình rõ ràng để kết nối học viên với gia sư phù hợp.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ProcessCard
                title="Dành cho học viên"
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
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
