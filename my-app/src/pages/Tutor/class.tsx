import { useState, useEffect } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { getMyClasses, getAllGradeLevels, type ClassResponse, type ApprovalStatus, type ClassStatus, type GradeLevelOption } from '../../api/classApi'
import { getAllSubjects, type SubjectOption } from '../../api/tutorProfile'

type DisplayStatus = 'pending' | 'recruiting' | 'teaching' | 'completed' | 'rejected'
type ClassTab = 'all' | DisplayStatus

const CLASS_TABS: { key: ClassTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'recruiting', label: 'Đang tuyển sinh' },
  { key: 'teaching', label: 'Đang dạy' },
  { key: 'completed', label: 'Đã hoàn thành' },
  { key: 'rejected', label: 'Đã từ chối' },
]

const STATUS_CONFIG: Record<DisplayStatus, { label: string; className: string }> = {
  pending:    { label: 'Chờ duyệt',     className: 'bg-yellow-100 text-yellow-600' },
  recruiting: { label: 'Đang tuyển sinh', className: 'bg-blue-100 text-blue-700' },
  teaching:   { label: 'Đang dạy',       className: 'bg-green-100 text-green-700' },
  completed:  { label: 'Hoàn thành',     className: 'bg-slate-100 text-slate-500' },
  rejected:   { label: 'Bị từ chối',     className: 'bg-red-100 text-red-600' },
}

function getDisplayStatus(approvalStatus: ApprovalStatus, classStatus: ClassStatus): DisplayStatus {
  if (approvalStatus === 'PENDING') return 'pending'
  if (approvalStatus === 'REJECTED') return 'rejected'
  if (classStatus === 'COMPLETED') return 'completed'
  if (classStatus === 'CLOSED') return 'teaching'  
  return 'recruiting'                               
}

const PAGE_SIZE = 4
const STATS_PAGE_SIZE = 100

function formatFee(fee: number) {
  return fee.toLocaleString('vi-VN') + 'đ/Khóa'
}

async function getAllMyClassesForStats() {
  const firstPage = await getMyClasses(0, STATS_PAGE_SIZE)
  if (firstPage.totalPages <= 1) return firstPage.content

  const restPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      getMyClasses(index + 1, STATS_PAGE_SIZE)
    )
  )

  return [firstPage, ...restPages].flatMap(pageData => pageData.content)
}

export function TutorClasses() {
  const [activeTab, setActiveTab] = useState<ClassTab>('all')
  const [classes, setClasses] = useState<ClassResponse[]>([])
  const [statsClasses, setStatsClasses] = useState<ClassResponse[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [subjectMap, setSubjectMap] = useState<Record<number, string>>({})
  const [gradeMap, setGradeMap] = useState<Record<number, string>>({})

  useEffect(() => {
    getAllSubjects().then(data => {
      const map: Record<number, string> = {}
      data.forEach((s: SubjectOption) => { map[s.id] = s.name })
      setSubjectMap(map)
    }).catch(() => {})

    getAllGradeLevels().then(data => {
      const map: Record<number, string> = {}
      data.forEach((g: GradeLevelOption) => { map[g.id] = g.name })
      setGradeMap(map)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    getAllMyClassesForStats()
      .then(data => {
        setStatsClasses(data)
        setLoading(false)
      })
      .catch(() => {
        setStatsClasses([])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    setPage(0)
  }, [activeTab])

  useEffect(() => {
    const filtered = activeTab === 'all'
      ? statsClasses
      : statsClasses.filter(cls => getDisplayStatus(cls.approvalStatus, cls.status) === activeTab)
    const start = page * PAGE_SIZE

    setClasses(filtered.slice(start, start + PAGE_SIZE))
    setTotalElements(filtered.length)
    setTotalPages(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)))
  }, [activeTab, page, statsClasses])

  const currentPage = page + 1

  const totalClasses  = statsClasses.length || totalElements
  const recruitingCount = statsClasses.filter(c => c.approvalStatus === 'APPROVED' && c.status === 'OPEN').length
  const teachingCount = statsClasses.filter(c => c.approvalStatus === 'APPROVED' && c.status === 'CLOSED').length
  const pendingCount  = statsClasses.filter(c => c.approvalStatus === 'PENDING').length
  const completedCount = statsClasses.filter(c => c.status === 'COMPLETED').length

  const handleDelete = (id: number) => {
    setClasses(prev => prev.filter(c => c.id !== id))
    setStatsClasses(prev => prev.filter(c => c.id !== id))
    setDeleteId(null)
  }

  return (
    <AccountLayout activePath="/tutor/classes">
      <div className="min-h-screen bg-slate-50 px-8 py-8 text-left">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">Quản lý lớp học</p>
              <p className="text-sm text-slate-500 mt-1">Theo dõi và quản lý các lớp học đang diễn ra của bạn.</p>
            </div>
            <button
              onClick={() => window.location.href = '/tutor/classes/new'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Tạo lớp mới
            </button>
          </div>

          <div className="grid grid-cols-5 gap-4">
            <StatCard
              icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              iconBg="bg-blue-100" label="Tổng số lớp" value={totalClasses}
            />
            <StatCard
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>}
              iconBg="bg-emerald-100" label="Lớp đang tuyển sinh" value={recruitingCount}
            />
            <StatCard
              icon={<svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="bg-sky-100" label="Lớp đang dạy" value={teachingCount}
            />
            <StatCard
              icon={<svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="bg-yellow-100" label="Chờ duyệt" value={pendingCount}
            />
            <StatCard
              icon={<svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="bg-rose-100" label="Lớp đã kết thúc" value={completedCount}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex border-b border-slate-200">
              {CLASS_TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-700 bg-blue-50/60 text-blue-700'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Đang tải...
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">
                  {activeTab === 'all'
                    ? 'Chưa có lớp học nào. Hãy tạo lớp đầu tiên!'
                    : 'Không có lớp học nào trong trạng thái này.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Tên lớp học', 'Môn học', 'Khối lớp', 'Học viên', 'Học phí', 'Trạng thái', 'Hành động'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls, idx) => {
                    const displayStatus = getDisplayStatus(cls.approvalStatus, cls.status)
                    return (
                      <tr key={cls.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx === classes.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-4 py-4 font-semibold text-slate-800 max-w-[160px]">{cls.title}</td>
                        <td className="px-4 py-4 text-slate-500">
                          {cls.subjectName || subjectMap[cls.subjectId] || '—'}
                        </td>
                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                          {cls.gradeLevelName || gradeMap[cls.gradeLevelId] || '—'}
                        </td>
                        <td className="px-4 py-4 min-w-[90px]">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-700 font-medium">{cls.currentStudents}/{cls.maxStudents}</span>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${(cls.currentStudents / cls.maxStudents) * 100}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-blue-700 font-semibold whitespace-nowrap">
                          {formatFee(cls.pricePerCourse)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_CONFIG[displayStatus].className}`}>
                            {STATUS_CONFIG[displayStatus].label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => window.location.href = `/tutor/classes/edit/${cls.id}`}
                              className="text-slate-400 hover:text-blue-600 transition-colors" title="Chỉnh sửa">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => window.location.href = `/tutor/classes/${cls.id}`}
                              className="text-slate-400 hover:text-blue-600 transition-colors" title="Xem chi tiết">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button onClick={() => setDeleteId(cls.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors" title="Xóa">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {!loading && totalElements > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Hiển thị {page * PAGE_SIZE + 1} – {Math.min((page + 1) * PAGE_SIZE, totalElements)} trong số {totalElements} lớp học
                </span>
                <div className="flex items-center gap-1">
                  <PageBtn onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </PageBtn>
                  {Array.from({ length: totalPages }, (_, i) => i).map(p => (
                    <PageBtn key={p} onClick={() => setPage(p)} active={p === page}>{p + 1}</PageBtn>
                  ))}
                  <PageBtn onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </PageBtn>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteId !== null && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa lớp học này không?"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </AccountLayout>
  )
}

function StatCard({ icon, iconBg, label, value }: {
  icon: React.ReactNode; iconBg: string; label: string; value: number
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>{icon}</div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{String(value).padStart(2, '0')}</p>
    </div>
  )
}

function PageBtn({ children, onClick, active, disabled }: {
  children: React.ReactNode; onClick: () => void; active?: boolean; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors
        ${active ? 'bg-blue-700 text-white' : 'text-slate-500 hover:bg-slate-100'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-800">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Hủy
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}
