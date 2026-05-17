import { useEffect, useMemo, useState } from "react";
import heroImage from "../assets/hero.png";
import { getMediaUrl } from "../api/axios";
import { getCategories, type GradeLevel, type SubjectCategory } from "../api/category";
import {
  searchTutorProfilesPaged,
  type Page,
  type TutorProfileSearchItem,
} from "../api/tutorProfile";
import { searchClassesPaged, type ClassResponse, type TeachingMode } from '../api/classApi'
import Navbar from "../layouts/Navbar";

type SearchMode = "tutor" | "class";

type ClassPost = {
  id: number;
  title: string;
  subjectId: number;
  gradeLevelId: number;
  budget?: number | null;
  location: string;
  schedule: string;
  description: string;
  teachingMode: TeachingMode | '';

};

type Step = {
  title: string;
  description: string;
};

const mockClassPosts: ClassPost[] = [
  {
    id: 1,
    title: "Cần gia sư Toán lớp 9 tại Cầu Giấy",
    subjectId: 1,
    gradeLevelId: 6,
    budget: 200000,
    location: "Cầu Giấy, Hà Nội",
    schedule: "T2, T4, T6",
    description: "Học sinh mất gốc đại số, cần gia sư kèm lộ trình nền tảng.",
    teachingMode: "OFFLINE",
  },
  {
    id: 2,
    title: "Tìm gia sư Tiếng Anh lớp 6",
    subjectId: 8,
    gradeLevelId: 4,
    budget: 180000,
    location: "Đống Đa, Hà Nội",
    schedule: "T3, T5",
    description: "Cải thiện ngữ pháp và kỹ năng nghe nói.",
    teachingMode: "ONLINE",
  },
];

  

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
    title: "Cập nhật TutorProfile",
    description:
      "Điền đầy đủ nghề nghiệp, học vấn, kinh nghiệm, môn dạy và thông tin giới thiệu.",
  },
  {
    title: "Xuất hiện trên tìm kiếm",
    description:
      "Hồ sơ được hiển thị để phụ huynh/học viên tìm kiếm theo bộ lọc phù hợp.",
  },
  {
    title: "Nhận lớp phù hợp",
    description:
      "Ứng tuyển lớp hoặc nhận liên hệ trực tiếp từ nhu cầu học tập phù hợp chuyên môn.",
  },
];

const TUTOR_PAGE_SIZE = 8;

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

function TutorCard({ tutor }: { tutor: TutorProfileSearchItem }) {
  const avatarUrl =
    getMediaUrl(tutor.avatar) ??
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80";

  return (
    <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:p-6">
      <div className="flex items-start gap-3">
        <img
          src={avatarUrl}
          alt={tutor.fullName}
          className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-950">
                {tutor.fullName}
                {tutor.isVerified ? (
                  <span className="ml-2 inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                    Xác thực
                  </span>
                ) : null}
              </h3>
              <p className="mt-0.5 text-sm text-slate-600">{tutor.major || "Gia sư"}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tutor.experience ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {tutor.experience}
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {tutor.subjects.length} môn dạy
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tutor.subjects.length > 0 ? (
          tutor.subjects.slice(0, 4).map((subjectName) => (
            <span
              key={subjectName}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
            >
              {subjectName}
            </span>
          ))
        ) : (
          <span className="text-xs italic text-slate-400">Chưa cập nhật môn dạy</span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          {tutor.isVerified ? (
            <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
              ✓ Đã xác thực
            </span>
          ) : (
            <span className="text-sm text-slate-500">Chưa xác thực</span>
          )}
        </div>
        <a
            href="/login"
          className="inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Xem hồ sơ
        </a>
      </div>
    </article>
  );
}

function ClassCard({
  classPost,
  subjectName,
  gradeName,
}: {
  classPost: ClassPost;
  subjectName: string;
  gradeName: string;
}) {
  const isUrgent = /cần|gấp|gấp/i.test(`${classPost.title} ${classPost.description}`);

  return (
    <article className="class-card h-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="heading-5 mb-1 text-lg font-semibold text-slate-950 truncate">
            {classPost.title}
          </h3>
          <div className="body-sm text-slate flex items-center gap-2 text-sm text-slate-600">
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z" />
              <circle cx="12" cy="10" r="2" />
            </svg>
            {classPost.location}
          </div>
        </div>

        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {isUrgent ? 'Gấp' : 'Đang mở'}
        </span>
      </div>

      <p className="body-sm mb-3 text-sm text-slate-600">{classPost.description}</p>

      <div className="discovery-meta-list mb-4 flex flex-wrap gap-2 text-xs text-slate-600">
        <div className="discovery-meta flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          {classPost.schedule}
        </div>

        <div className="discovery-meta flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4" />
          </svg>
          {gradeName}
        </div>

        <div className="discovery-meta flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 21a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-13z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4" />
          </svg>
          {subjectName}
        </div>

        <div className="discovery-meta flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422" />
          </svg>
          {classPost.budget != null ? `${classPost.budget.toLocaleString('vi-VN')} ₫` : 'N/A'} / khóa
        </div>
        <div className="discovery-meta flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422" />
          </svg>
          {classPost.teachingMode ? classPost.teachingMode : 'N/A'}
        </div>
      </div>

      <div className="discovery-card-footer mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        {/* <div>
          <div className="body-md-medium text-primary-brand text-lg font-bold text-blue-700">{classPost.budget != null ? `${classPost.budget.toLocaleString('vi-VN')} ₫` : 'N/A'}/ khóa</div>
          
        </div> */}

        <a href="/login" className="btn-brand-primary inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          Ứng tuyển
        </a>
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
  const [searchMode, setSearchMode] = useState<SearchMode>("tutor");
  const [keyword, setKeyword] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState<string>("");
  const [occupationType, setOccupationType] = useState<string>("");
  const [experienceFilter, setExperienceFilter] = useState<string>("");
  const [specialFilter, setSpecialFilter] = useState<string>("ONLINE");
  const [verifiedOnly] = useState<boolean>(false);
  const [tutorResults, setTutorResults] = useState<TutorProfileSearchItem[]>([]);
  const [tutorPage, setTutorPage] = useState(0);
  const [tutorTotalPages, setTutorTotalPages] = useState(0);
  const [tutorTotalElements, setTutorTotalElements] = useState(0);
  const [isLoadingTutors, setIsLoadingTutors] = useState(false);
  const [tutorError, setTutorError] = useState("");
  const [classResults, setClassResults] = useState<ClassPost[]>([]);
  const [classPage, setClassPage] = useState(0);
  const [classTotalPages, setClassTotalPages] = useState(0);
  const [classTotalElements, setClassTotalElements] = useState(0);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [classError, setClassError] = useState('');

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

  const selectedSubjectName = useMemo(() => {
    if (!selectedSubjectId) {
      return "";
    }

    for (const category of categories) {
      const selectedSubject = category.subjects.find(
        (subject) => String(subject.id) === selectedSubjectId
      );

      if (selectedSubject) {
        return selectedSubject.name;
      }
    }

    return "";
  }, [categories, selectedSubjectId]);

  useEffect(() => {
    setSelectedGradeLevelId("");
  }, [selectedSubjectId]);

  const loadTutorResults = async (page = 0) => {
    setIsLoadingTutors(true);
    setTutorError("");

    try {
      const data: Page<TutorProfileSearchItem> = await searchTutorProfilesPaged({
        name: keyword.trim() || undefined,
        occupation: occupationType || undefined,
        experience: experienceFilter || undefined,
        subjectName: selectedSubjectName || undefined,
        page,
        size: TUTOR_PAGE_SIZE,
      });

      setTutorResults(data.content);
      setTutorPage(data.number);
      setTutorTotalPages(data.totalPages);
      setTutorTotalElements(data.totalElements);
    } catch {
      setTutorError("Không thể tải danh sách gia sư. Vui lòng thử lại.");
      setTutorResults([]);
      setTutorTotalPages(0);
      setTutorTotalElements(0);
    } finally {
      setIsLoadingTutors(false);
    }
  };

  useEffect(() => {
    loadTutorResults();
    loadClassResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadClassResults(page = 0) {
    setIsLoadingClasses(true)
    setClassError('')

    try {
      const data = await searchClassesPaged({
        subjectId: selectedSubjectId ? Number(selectedSubjectId) : undefined,
        gradeLevelId: selectedGradeLevelId ? Number(selectedGradeLevelId) : undefined,
        teachingMode: specialFilter || undefined,
        city: undefined,
        title: keyword.trim() || undefined,
        page,
        size: 12,
      })

      const mapped = data.content.map((c: ClassResponse) => {
        const scheduleStr =
          c.schedules && c.schedules.length
            ? c.schedules
                .map((s) => s.dayLabel)
                .join(', ')
            : ''

        const budgetNum = c.pricePerCourse != null ? c.pricePerCourse : null

        return {
          id: c.id,
          title: c.title,
          subjectId: c.subjectId,
          gradeLevelId: c.gradeLevelId,
          budget: budgetNum,
          location: c.city || c.address || '',
          schedule: scheduleStr,
          description: c.description || '',
          teachingMode: (c.teachingMode as TeachingMode) || '',
        } as ClassPost
      })

      setClassResults(mapped)
      setClassPage(data.number)
      setClassTotalPages(data.totalPages)
      setClassTotalElements(data.totalElements)
    } catch (e) {
      // provide more detailed error when available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err: any = e
      const msg = err?.response?.data?.message || err.message || 'Không thể tải danh sách lớp. Vui lòng thử lại.'
      setClassError(msg)
      console.error('loadClassResults error:', err)
      setClassResults([])
      setClassTotalPages(0)
      setClassTotalElements(0)
    } finally {
      setIsLoadingClasses(false)
    }
  }

  const subjectNameById = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((category) => {
      category.subjects.forEach((subject) => map.set(subject.id, subject.name));
    });
    return map;
  }, [categories]);

  const gradeNameById = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((category) => {
      category.subjects.forEach((subject) => {
        subject.gradeLevels.forEach((grade) => map.set(grade.id, grade.name));
      });
    });
    return map;
  }, [categories]);

  const filteredTutorResults = useMemo(
    () => tutorResults.filter((tutor) => !verifiedOnly || tutor.isVerified),
    [tutorResults, verifiedOnly]
  );

  const goToTutorPage = async (nextPage: number) => {
    if (nextPage < 0 || nextPage >= tutorTotalPages || isLoadingTutors) {
      return;
    }

    await loadTutorResults(nextPage);
  };

  const filteredClassPosts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return classResults

    return classResults.filter((item) => {
      const normalizedTitle = item.title.toLowerCase();
      const normalizedDescription = item.description.toLowerCase();
      return (
        normalizedTitle.includes(normalizedKeyword) ||
        normalizedDescription.includes(normalizedKeyword) ||
        item.location.toLowerCase().includes(normalizedKeyword)
      )
    })
  }, [keyword, classResults]);

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (searchMode === "tutor") {
      await loadTutorResults(0);
    } else {
      await loadClassResults(0);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 text-left text-slate-900">
     
      <Navbar />

      <main className="w-full flex-1">
        <section className="relative w-full overflow-hidden bg-slate-950 text-white">
          <img
            src={heroImage}
            alt="Học viên đang học cùng gia sư"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-slate-950" />

          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
            <span className="mb-3 rounded-full bg-purple-600/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-100">
              Nền tảng giáo dục 1 kèm 1
            </span>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-4xl">
              <span className="block !text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
            EduMatch Pro - Kết nối gia sư 1 kèm 1
              </span>
            </h1>
          

          <form
            onSubmit={handleSearchSubmit}
            className="mt-10 flex w-full max-w-6xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6"
          >
            {/* Mode toggle */}
            <div className="flex w-full flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSearchMode("tutor")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  searchMode === "tutor"
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tìm gia sư
              </button>
              <button
                type="button"
                onClick={() => setSearchMode("class")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  searchMode === "class"
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tìm lớp học
              </button>
            </div>

            {searchMode === "tutor" ? (
              <>
                <div className="flex w-full gap-3">
                  <label className="relative flex-1">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <SearchIcon />
                    </span>
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      type="text"
                      placeholder="Tên môn học"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex h-12 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    Tìm kiếm
                    <ArrowRightIcon />
                  </button>
                </div>

                <div className="grid w-full  gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="flex w-full  flex-col items-start gap-4 border-t border-slate-100 pt-4">
                    <label className="w-full max-w-56">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Nghề nghiệp
                      </span>
                      <select
                        value={occupationType}
                        onChange={(e) => setOccupationType(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-600"
                      >
                        <option value="">Tất cả</option>
                        <option value="student">Sinh viên</option>
                        <option value="teacher">Giáo viên</option>
                        <option value="lecturer">Giảng viên</option>
                        <option value="worker">Người đi làm</option>
                      </select>
                    </label>

                    <label className="w-full max-w-56">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Môn dạy
                      </span>
                      <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-600"
                      >
                        <option value="">Tất cả môn học</option>
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

                    <label className="w-full max-w-56">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Kinh nghiệm
                      </span>
                      <select
                        value={experienceFilter}
                        onChange={(e) => setExperienceFilter(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-600"
                      >
                        <option value="">Tất cả</option>
                        <option value="Dưới 1 năm">Dưới 1 năm</option>
                        <option value="1 - 2 năm">1 - 2 năm</option>
                        <option value="2 - 3 năm">2 - 3 năm</option>
                        <option value="3 - 5 năm">3 - 5 năm</option>
                        <option value="Trên 5 năm">Trên 5 năm</option>
                      </select>
                    </label>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                        {tutorTotalElements || filteredTutorResults.length} gia sư
                      </span>
                    </div>

                    {tutorError ? (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {tutorError}
                      </div>
                    ) : null}

                    {isLoadingTutors ? (
                      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">
                        Đang tải dữ liệu gia sư...
                      </div>
                    ) : filteredTutorResults.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                        Không có gia sư phù hợp với bộ lọc hiện tại.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          {filteredTutorResults.map((tutor) => (
                            <TutorCard key={tutor.id} tutor={tutor} />
                          ))}
                        </div>

                        {tutorTotalPages > 1 ? (
                          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm text-slate-600">
                              Hiển thị trang <strong>{tutorPage + 1}</strong> / {tutorTotalPages}
                            </span>

                            <nav aria-label="Pagination">
                              <ul className="flex items-center gap-1">
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => goToTutorPage(tutorPage - 1)}
                                    disabled={tutorPage === 0 || isLoadingTutors}
                                    className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    ‹
                                  </button>
                                </li>
                                {Array.from({ length: Math.min(tutorTotalPages, 3) }, (_, index) => {
                                  const pageWindowStart = Math.max(
                                    0,
                                    Math.min(tutorPage - 1, tutorTotalPages - 3)
                                  );
                                  const pageNumber = pageWindowStart + index;
                                  const isActive = pageNumber === tutorPage;

                                  return (
                                    <li key={pageNumber}>
                                      <button
                                        type="button"
                                        onClick={() => goToTutorPage(pageNumber)}
                                        className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition ${
                                          isActive
                                            ? "bg-blue-700 text-white"
                                            : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                                        }`}
                                      >
                                        {pageNumber + 1}
                                      </button>
                                    </li>
                                  );
                                })}
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => goToTutorPage(tutorPage + 1)}
                                    disabled={tutorPage + 1 >= tutorTotalPages || isLoadingTutors}
                                    className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    ›
                                  </button>
                                </li>
                              </ul>
                            </nav>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex w-full gap-3">
                  <label className="relative flex-1">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <SearchIcon />
                    </span>
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      type="text"
                      placeholder="Tên lớp "
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex h-12 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    Tìm kiếm
                    <ArrowRightIcon />
                  </button>
                </div>

                <div className="grid w-full gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="flex w-full flex-col items-start gap-4 border-t border-slate-100 pt-4">
                    <label className="w-full max-w-56">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Môn học</span>
                      <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-600">
                        <option value="">Tất cả môn học</option>
                        {categories.map((category) => (
                          <optgroup key={category.id} label={category.name}>
                            {category.subjects.map((subject) => (
                              <option key={subject.id} value={subject.id}>{subject.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </label>

                    <label className="w-full max-w-56">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Cấp học</span>
                      <select value={selectedGradeLevelId} onChange={(e) => setSelectedGradeLevelId(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-600">
                        <option value="">Tất cả cấp học</option>
                        {gradeLevelOptions.map((level) => (
                          <option key={level.id} value={level.id}>{level.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="w-full max-w-56">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Bộ lọc nhanh</span>
                      <select value={specialFilter} onChange={(e) => setSpecialFilter(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-600">
                        <option value="ONLINE">Học online</option>
                        <option value="OFFLINE">Học offline</option>
                        <option value="">Tất cả hình thức</option>
                      </select>
                    </label>

                   
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">{classTotalElements || filteredClassPosts.length} lớp học</span>
                    </div>

                    {classError ? (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{classError}</div>
                    ) : null}

                    {isLoadingClasses ? (
                      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">Đang tải dữ liệu lớp...</div>
                    ) : filteredClassPosts.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Không có lớp phù hợp với bộ lọc hiện tại.</div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          {filteredClassPosts.slice(0, 4).map((classPost) => (
                            <ClassCard key={classPost.id} classPost={classPost} subjectName={subjectNameById.get(classPost.subjectId) ?? 'Môn học'} gradeName={gradeNameById.get(classPost.gradeLevelId) ?? 'Cấp học'} />
                          ))}
                        </div>

                        {classTotalPages > 1 ? (
                          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm text-slate-600">Hiển thị trang <strong>{classPage + 1}</strong> / {classTotalPages}</span>
                            <nav aria-label="Pagination">
                              <ul className="flex items-center gap-1">
                                <li>
                                  <button type="button" onClick={() => loadClassResults(classPage - 1)} disabled={classPage === 0 || isLoadingClasses} className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">‹</button>
                                </li>
                                {Array.from({ length: Math.min(classTotalPages, 3) }, (_, index) => {
                                  const pageWindowStart = Math.max(0, Math.min(classPage - 1, classTotalPages - 3));
                                  const pageNumber = pageWindowStart + index;
                                  const isActive = pageNumber === classPage;

                                  return (
                                    <li key={pageNumber}>
                                      <button type="button" onClick={() => loadClassResults(pageNumber)} className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition ${isActive ? "bg-blue-700 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"}`}>
                                        {pageNumber + 1}
                                      </button>
                                    </li>
                                  )
                                })}
                                <li>
                                  <button type="button" onClick={() => loadClassResults(classPage + 1)} disabled={classPage + 1 >= classTotalPages || isLoadingClasses} className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">›</button>
                                </li>
                              </ul>
                            </nav>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </form>
          </div>
        </section>

        {searchMode === "class" ? (
          <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">Kết quả tìm lớp học</h2>
                <p className="mt-3 max-w-2xl text-slate-600">Danh sách lớp học đang mở để gia sư ứng tuyển nhanh theo môn và cấp học.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{filteredClassPosts.length} lớp học</span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-700">Bộ lọc</h4>
                  <div className="space-y-3">
                    <label className="block text-sm text-slate-600">Môn học</label>
                    <select value={selectedSubjectId} onChange={(e)=>setSelectedSubjectId(e.target.value)} className="w-full rounded-lg border p-2">
                      <option value="">Tất cả</option>
                      {categories.map(cat=> (
                        <optgroup key={cat.id} label={cat.name}>
                          {cat.subjects.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
                        </optgroup>
                      ))}
                    </select>

                    <label className="block text-sm text-slate-600">Cấp học</label>
                    <select value={selectedGradeLevelId} onChange={(e)=>setSelectedGradeLevelId(e.target.value)} className="w-full rounded-lg border p-2">
                      <option value="">Tất cả</option>
                      {gradeLevelOptions.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>

                    <label className="block text-sm text-slate-600">Bộ lọc nhanh</label>
                    <select value={specialFilter} onChange={(e)=>setSpecialFilter(e.target.value)} className="w-full rounded-lg border p-2">
                      <option value="">Tất cả</option>
                      <option value="top-rated">Top đánh giá</option>
                      <option value="online">Học online</option>
                      <option value="evening">Có lịch tối</option>
                    </select>

                    <button onClick={()=>{}} className="mt-2 w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Áp dụng</button>
                  </div>
                </div>
              </aside>

              <div>
                {filteredClassPosts.length > 0 ? (
                  <div className="mb-6 rounded-2xl bg-amber-50 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">Lớp ưu tiên</span>
                        <h3 className="mt-2 text-2xl font-bold text-slate-950">{(classResults[0] ?? mockClassPosts[0]).title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{(classResults[0] ?? mockClassPosts[0]).description}</p>
                      </div>
                      <div className="mt-2 flex gap-4 text-slate-700 md:mt-0">
                        <div className="text-center"><div className="text-lg font-bold">{(classResults[0] ?? mockClassPosts[0]).schedule.split(',').length}</div><div className="text-sm text-slate-500">buổi/tuần</div></div>
                        <div className="text-center"><div className="text-lg font-bold">Gấp</div><div className="text-sm text-slate-500">trong 24h</div></div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Hiển thị <strong>{filteredClassPosts.length}</strong> lớp học phù hợp</span>
                  <select className="rounded-lg border p-2 text-sm">
                    <option>Mới nhất</option>
                    <option>Học phí cao</option>
                    <option>Gần nhất</option>
                  </select>
                </div>

                {classError ? (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{classError}</div>
                ) : isLoadingClasses ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">Đang tải dữ liệu lớp...</div>
                ) : filteredClassPosts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Không tìm thấy lớp học phù hợp.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClassPosts.map((classPost) => (
                      <ClassCard key={classPost.id} classPost={classPost} subjectName={subjectNameById.get(classPost.subjectId) ?? 'Môn học'} gradeName={gradeNameById.get(classPost.gradeLevelId) ?? 'Cấp học'} />
                    ))}
                  </div>
                )}

                <nav className="mt-6">
                  <ul className="flex items-center justify-center gap-2">
                    <li><button className="inline-flex h-9 w-9 items-center justify-center rounded-md border">1</button></li>
                    <li><button className="inline-flex h-9 w-9 items-center justify-center rounded-md border">2</button></li>
                    <li><button className="inline-flex h-9 w-9 items-center justify-center rounded-md border">›</button></li>
                  </ul>
                </nav>
              </div>
            </div>
          </section>
        ) : null}

        

        

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
          <div className="rounded-2xl bg-blue-50 px-6 py-10 text-center">
            <h2 className="text-3xl font-bold text-slate-950">Sẵn sàng tìm gia sư phù hợp?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Đăng lớp ngay hôm nay — Miễn phí tìm & đổi gia sư, tặng 1 buổi học thử.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="/register"
                className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Đăng lớp ngay
              </a>
              <a
                href="#"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Liên hệ tư vấn
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <h4 className="text-lg font-bold text-slate-900">GiasuHome.vn</h4>
            <p className="mt-2 text-sm text-slate-600">Nền tảng kết nối gia sư 1 kèm 1</p>
            <p className="mt-1 text-sm text-slate-600">Hotline: 0369 148 660</p>
            <p className="text-sm text-slate-600">Email: giasuhome.vn@gmail.com</p>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">Tài liệu</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Hợp đồng giao lớp</li>
              <li>Hợp đồng gia sư</li>
              <li>Báo cáo học tập</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">Tư vấn</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Giới thiệu</li>
              <li>Blog</li>
              <li>Hỏi đáp</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">Kết nối</h4>
            <div className="mt-3 flex gap-2">
              {["Facebook", "Messenger", "YouTube"].map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="border-t border-slate-200 px-4 py-4 text-center text-sm text-slate-500">
          © 2026 GiasuHome.vn. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default HomePage;
