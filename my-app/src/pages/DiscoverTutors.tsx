import { useEffect, useMemo, useState } from "react";
import { getMediaUrl } from "../api/axios";
import { getCategories, type SubjectCategory } from "../api/category";
import {
  searchTutorProfilesPaged,
  type Page,
  type TutorProfileSearchItem,
} from "../api/tutorProfile";
import Navbar from "../layouts/Navbar";

const PAGE_SIZE = 9;

function TutorCard({ tutor }: { tutor: TutorProfileSearchItem }) {
  const avatarUrl =
    getMediaUrl(tutor.avatar) ??
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80";

  return (
    <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <img
          src={avatarUrl}
          alt={tutor.fullName}
          className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold text-slate-950">{tutor.fullName}</h3>
            {tutor.isVerified ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Đã xác thực
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">{tutor.major || "Gia sư tự do"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tutor.experience ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {tutor.experience}
          </span>
        ) : null}
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {tutor.subjects.length} môn dạy
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tutor.subjects.length > 0 ? (
          tutor.subjects.slice(0, 5).map((subjectName) => (
            <span
              key={subjectName}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              {subjectName}
            </span>
          ))
        ) : (
          <span className="text-sm italic text-slate-400">Chưa cập nhật môn dạy</span>
        )}
      </div>

      <div className="mt-auto grid min-h-[76px] grid-cols-[minmax(0,1fr)_128px] items-center gap-4 border-t border-slate-100 pt-5">
        <span className="min-w-0 max-w-[180px] text-sm font-medium leading-5 text-slate-500">
          {tutor.isVerified ? "Hồ sơ sẵn sàng liên hệ" : "Đang cập nhật hồ sơ"}
        </span>
        <a
          href={`/tutor/${tutor.userId ?? tutor.profileId ?? tutor.id}`}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-700 px-4 text-center text-sm font-semibold leading-5 text-white transition hover:bg-blue-800"
        >
          Xem hồ sơ
        </a>
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
      <nav aria-label="Phân trang gia sư">
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

function DiscoverTutors() {
  const [categories, setCategories] = useState<SubjectCategory[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [occupationType, setOccupationType] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [results, setResults] = useState<TutorProfileSearchItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const selectedSubjectName = useMemo(() => {
    if (!selectedSubjectId) return "";

    for (const category of categories) {
      const selectedSubject = category.subjects.find(
        (subject) => String(subject.id) === selectedSubjectId
      );
      if (selectedSubject) return selectedSubject.name;
    }

    return "";
  }, [categories, selectedSubjectId]);

  const getSubjectName = (subjectId: string) => {
    if (!subjectId) return "";

    for (const category of categories) {
      const selectedSubject = category.subjects.find(
        (subject) => String(subject.id) === subjectId
      );
      if (selectedSubject) return selectedSubject.name;
    }

    return "";
  };

  const filteredResults = useMemo(
    () => results.filter((tutor) => !verifiedOnly || tutor.isVerified),
    [results, verifiedOnly]
  );

  const loadResults = async (
    nextPage = 0,
    filters = {
      keyword,
      occupationType,
      experienceFilter,
      subjectName: selectedSubjectName,
    }
  ) => {
    setIsLoading(true);
    setError("");

    try {
      const data: Page<TutorProfileSearchItem> = await searchTutorProfilesPaged({
        name: filters.keyword.trim() || undefined,
        occupation: filters.occupationType || undefined,
        experience: filters.experienceFilter || undefined,
        subjectName: filters.subjectName || undefined,
        page: nextPage,
        size: PAGE_SIZE,
      });

      setResults(data.content);
      setPage(data.number);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError("Không thể tải danh sách gia sư. Vui lòng thử lại.");
      setResults([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await loadResults(0);
  };

  const resetFilters = async () => {
    setKeyword("");
    setSelectedSubjectId("");
    setOccupationType("");
    setExperienceFilter("");
    setVerifiedOnly(false);
    await loadResults(0, {
      keyword: "",
      occupationType: "",
      experienceFilter: "",
      subjectName: getSubjectName(""),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white text-slate-900">
      <Navbar />
      <main>
        <section className="border-b border-blue-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-0 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-950">
                  Tìm gia sư phù hợp
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm">
                  <strong className="text-slate-950">{totalElements}</strong>
                  <span className="ml-1 text-slate-500">gia sư</span>
                </div>
                <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm">
                  <strong className="text-slate-950">
                    {filteredResults.filter((tutor) => tutor.isVerified).length}
                  </strong>
                  <span className="ml-1 text-slate-500">đã xác thực</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
          <form
            onSubmit={handleSubmit}
            className="h-fit rounded-lg border border-blue-100 bg-white p-5 shadow-sm"
          >
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
                  placeholder="Tên gia sư hoặc từ khóa"
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Môn dạy</span>
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
                <span className="mb-1 block text-sm font-semibold text-slate-700">Nghề nghiệp</span>
                <select
                  value={occupationType}
                  onChange={(event) => setOccupationType(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
                >
                  <option value="">Tất cả</option>
                  <option value="student">Sinh viên</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="lecturer">Giảng viên</option>
                  <option value="worker">Người đi làm</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Kinh nghiệm</span>
                <select
                  value={experienceFilter}
                  onChange={(event) => setExperienceFilter(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
                >
                  <option value="">Tất cả</option>
                  <option value="Dưới 1 năm">Dưới 1 năm</option>
                  <option value="1 - 2 năm">1 - 2 năm</option>
                  <option value="2 - 3 năm">2 - 3 năm</option>
                  <option value="3 - 5 năm">3 - 5 năm</option>
                  <option value="Trên 5 năm">Trên 5 năm</option>
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(event) => setVerifiedOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                Chỉ hiển thị hồ sơ đã xác thực
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Đang tìm..." : "Áp dụng bộ lọc"}
              </button>
            </div>
          </form>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Hiển thị <strong>{filteredResults.length}</strong> gia sư phù hợp
              </p>
              <a
                href="/discover/classes"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Xem lớp đang mở
              </a>
            </div>

            {error ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
                Đang tải dữ liệu gia sư...
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                Không có gia sư phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
                {filteredResults.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} loading={isLoading} onChange={loadResults} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default DiscoverTutors;
