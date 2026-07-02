import { useEffect, useMemo, useState } from "react";
import { getCategories, type GradeLevel, type SubjectCategory } from "../api/category";
import { searchClassesPaged, type ClassResponse, type TeachingMode } from "../api/classApi";
import Navbar from "../layouts/Navbar";
import { EnrollmentModal } from "../components/EnrollmentModal";

const PAGE_SIZE = 9;

type ClassPost = {
  id: number;
  tutorId: number;
  tutorName: string | null;
  title: string;
  subjectId: number;
  gradeLevelId: number;
  budget: number | null;
  location: string;
  schedule: string;
  description: string;
  teachingMode: TeachingMode | "";
  totalSessions: number | null;
  maxStudents: number | null;
};

function formatMode(mode: TeachingMode | "") {
  if (mode === "ONLINE") return "Online";
  if (mode === "OFFLINE") return "Offline";
  return "Chưa cập nhật";
}

function mapClassResponse(item: ClassResponse): ClassPost {
  const schedule =
    item.schedules && item.schedules.length
      ? item.schedules.map((scheduleItem) => scheduleItem.dayLabel).join(", ")
      : "Linh hoạt";

  return {
    id: item.id,
    tutorId: item.tutorId,
    tutorName: item.tutorName || null,
    title: item.title,
    subjectId: item.subjectId,
    gradeLevelId: item.gradeLevelId,
    budget: item.pricePerCourse ?? null,
    location: item.city || item.address || "Chưa cập nhật địa điểm",
    schedule,
    description: item.description || "Lớp học đang chờ gia sư phù hợp.",
    teachingMode: item.teachingMode || "",
    totalSessions: item.totalSessions ?? null,
    maxStudents: item.maxStudents ?? null,
  };
}

function ClassCard({
  classPost,
  subjectName,
  gradeName,
  onEnroll,
}: {
  classPost: ClassPost;
  subjectName: string;
  gradeName: string;
  onEnroll: (classPost: ClassPost) => void;
}) {
  const isUrgent = /cần|gấp|ngay/i.test(`${classPost.title} ${classPost.description}`);

  return (
    <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="max-w-[12rem] truncate rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700" title={subjectName}>
              {subjectName}
            </span>
            <span className="max-w-[8rem] shrink-0 truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" title={gradeName}>
              {gradeName}
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              isUrgent ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {isUrgent ? "Gấp" : "Đang mở"}
          </span>
        </div>
        <h3 className="line-clamp-2 w-full text-lg font-bold leading-6 text-slate-950">
          {classPost.title}
        </h3>
        <a
          href={`/tutor/${classPost.tutorId}`}
          className="mt-2 inline-flex max-w-full items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
            {(classPost.tutorName || "G").charAt(0).toUpperCase()}
          </span>
          <span className="truncate">{classPost.tutorName || `Gia sư #${classPost.tutorId}`}</span>
        </a>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{classPost.description}</p>

      <div className="mt-5 grid gap-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          {classPost.location}
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-500" />
          {classPost.schedule}
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {formatMode(classPost.teachingMode)}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <div>
          <div className="text-lg font-bold text-blue-700">
            {classPost.budget != null
              ? `${classPost.budget.toLocaleString("vi-VN")} đ`
              : "Thỏa thuận"}
          </div>
          <div className="text-xs font-medium text-slate-500">
            {classPost.totalSessions ? `${classPost.totalSessions} buổi` : "Theo lộ trình"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/tutor/${classPost.tutorId}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Xem hồ sơ
          </a>
          <button
            onClick={() => onEnroll(classPost)}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Đăng ký học
          </button>
        </div>
      </div>
    </article>
  );
}

function Pagination({
  page,
  totalPages,
  loading,
  onChange,
}: {
  page: number;
  totalPages: number;
  loading: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pageWindowStart = Math.max(0, Math.min(page - 1, totalPages - 3));
  const visiblePages = Array.from({ length: Math.min(totalPages, 3) }, (_, index) => {
    return pageWindowStart + index;
  });

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-slate-600">
        Trang <strong>{page + 1}</strong> / {totalPages}
      </span>
      <nav aria-label="Phân trang lớp học">
        <ul className="flex items-center gap-1">
          <li>
            <button
              type="button"
              onClick={() => onChange(page - 1)}
              disabled={page === 0 || loading}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ‹
            </button>
          </li>
          {visiblePages.map((pageNumber) => {
            const isActive = pageNumber === page;
            return (
              <li key={pageNumber}>
                <button
                  type="button"
                  onClick={() => onChange(pageNumber)}
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
              onClick={() => onChange(page + 1)}
              disabled={page + 1 >= totalPages || loading}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ›
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function DiscoverClasses() {
  const [categories, setCategories] = useState<SubjectCategory[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState("");
  const [teachingMode, setTeachingMode] = useState("");
  const [city, setCity] = useState("");
  const [results, setResults] = useState<ClassPost[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [enrollingClass, setEnrollingClass] = useState<ClassPost | null>(null);

  const handleOpenEnrollment = (classPost: ClassPost) => {
    setEnrollingClass(classPost)
  }

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const gradeLevelOptions: GradeLevel[] = useMemo(() => {
    if (!selectedSubjectId) return [];

    for (const category of categories) {
      const selectedSubject = category.subjects.find(
        (subject) => String(subject.id) === selectedSubjectId
      );
      if (selectedSubject) return selectedSubject.gradeLevels;
    }

    return [];
  }, [categories, selectedSubjectId]);

  useEffect(() => {
    setSelectedGradeLevelId("");
  }, [selectedSubjectId]);

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

  const loadResults = async (
    nextPage = 0,
    filters = {
      keyword,
      selectedSubjectId,
      selectedGradeLevelId,
      teachingMode,
      city,
    }
  ) => {
    setIsLoading(true);
    setError("");

    try {
      const data = await searchClassesPaged({
        subjectId: filters.selectedSubjectId ? Number(filters.selectedSubjectId) : undefined,
        gradeLevelId: filters.selectedGradeLevelId ? Number(filters.selectedGradeLevelId) : undefined,
        teachingMode: filters.teachingMode || undefined,
        city: filters.city.trim() || undefined,
        title: filters.keyword.trim() || undefined,
        page: nextPage,
        size: PAGE_SIZE,
      });

      setResults(data.content.map(mapClassResponse));
      setPage(data.number);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError("Không thể tải danh sách lớp học. Vui lòng thử lại.");
      setResults([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search when any filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadResults(0);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, selectedSubjectId, selectedGradeLevelId, teachingMode, city]);

  const resetFilters = async () => {
    setKeyword("");
    setSelectedSubjectId("");
    setSelectedGradeLevelId("");
    setTeachingMode("");
    setCity("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-slate-50 to-white text-slate-900">
      <Navbar />
      <main>
        <section className="border-b border-cyan-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-0 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-950">
                  Tìm lớp học đang mở
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-sm">
                  <strong className="text-slate-950">{totalElements}</strong>
                  <span className="ml-1 text-slate-500">lớp học</span>
                </div>
                <div className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-sm">
                  <strong className="text-slate-950">
                    {results.filter((item) => item.teachingMode === "ONLINE").length}
                  </strong>
                  <span className="ml-1 text-slate-500">online</span>
                </div>
                <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm">
                  <strong className="text-slate-950">
                    {results.filter((item) => item.teachingMode === "OFFLINE").length}
                  </strong>
                  <span className="ml-1 text-slate-500">offline</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
          <div className="h-fit rounded-lg border border-cyan-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-950">Bộ lọc</h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Xóa lọc
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Từ khóa</span>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tên lớp hoặc nhu cầu học"
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Môn học</span>
                <select
                  value={selectedSubjectId}
                  onChange={(event) => setSelectedSubjectId(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
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

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Cấp học</span>
                <select
                  value={selectedGradeLevelId}
                  onChange={(event) => setSelectedGradeLevelId(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
                >
                  <option value="">Tất cả cấp học</option>
                  {gradeLevelOptions.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Hình thức học
                </span>
                <select
                  value={teachingMode}
                  onChange={(event) => setTeachingMode(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
                >
                  <option value="">Tất cả</option>
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Thành phố</span>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Ví dụ: Hà Nội"
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

            </div>
          </div>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Hiển thị <strong>{results.length}</strong> lớp học phù hợp
              </p>
              <a
                href="/discover/tutors"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tìm gia sư
              </a>
            </div>

            {error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
                Đang tải dữ liệu lớp học...
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                Không tìm thấy lớp học phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
                {results.map((classPost) => (
                  <ClassCard
                    key={classPost.id}
                    classPost={classPost}
                    subjectName={subjectNameById.get(classPost.subjectId) ?? "Môn học"}
                    gradeName={gradeNameById.get(classPost.gradeLevelId) ?? "Cấp học"}
                    onEnroll={handleOpenEnrollment}
                  />
                ))}
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} loading={isLoading} onChange={loadResults} />
          </div>
        </section>
      </main>

      {/* Enrollment Modal */}
      {enrollingClass && (
        <EnrollmentModal
          isOpen={true}
          classId={enrollingClass.id}
          classTitle={enrollingClass.title}
          budget={enrollingClass.budget}
          totalSessions={enrollingClass.totalSessions}
          onClose={() => setEnrollingClass(null)}
        />
      )}
    </div>
  );
}

export default DiscoverClasses;

