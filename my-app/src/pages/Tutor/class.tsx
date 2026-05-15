import { useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'

type ClassStatus = 'recruiting' | 'teaching' | 'completed' | 'pending'

interface TutorClass {
  id: number
  name: string
  subject: string
  grade: string
  enrolled: number
  maxStudents: number
  feePerSession: number
  status: ClassStatus
}

const MOCK_CLASSES: TutorClass[] = [
  { id: 1, name: 'Toán nâng cao lớp 9', subject: 'Toán học', grade: 'Lớp 9', enrolled: 0, maxStudents: 5, feePerSession: 2000000, status: 'pending' },
  { id: 2, name: 'Luyện thi Ielts Foundation', subject: 'Tiếng Anh', grade: 'Mọi khối lớp', enrolled: 12, maxStudents: 12, feePerSession: 3500000, status: 'teaching' },
  { id: 3, name: 'Vật lý 12 Cơ bản', subject: 'Vật lý', grade: 'Lớp 12', enrolled: 5, maxStudents: 5, feePerSession: 1800000, status: 'completed' },
  { id: 4, name: 'Hóa học 11 - Nhóm bồi dưỡng', subject: 'Hóa học', grade: 'Lớp 11', enrolled: 3, maxStudents: 8, feePerSession: 2200000, status: 'recruiting' },
  { id: 5, name: 'Toán đại số lớp 10', subject: 'Toán học', grade: 'Lớp 10', enrolled: 4, maxStudents: 6, feePerSession: 1800000, status: 'teaching' },
  { id: 6, name: 'Ngữ văn lớp 12 luyện thi', subject: 'Ngữ văn', grade: 'Lớp 12', enrolled: 7, maxStudents: 10, feePerSession: 1500000, status: 'teaching' },
  { id: 7, name: 'Sinh học 11 nâng cao', subject: 'Sinh học', grade: 'Lớp 11', enrolled: 2, maxStudents: 5, feePerSession: 1600000, status: 'recruiting' },
  { id: 8, name: 'Tiếng Anh giao tiếp cơ bản', subject: 'Tiếng Anh', grade: 'Mọi khối lớp', enrolled: 8, maxStudents: 8, feePerSession: 2500000, status: 'completed' },
  { id: 9, name: 'Hóa học 12 ôn thi ĐH', subject: 'Hóa học', grade: 'Lớp 12', enrolled: 6, maxStudents: 8, feePerSession: 2000000, status: 'teaching' },
  { id: 10, name: 'Vật lý 11 cơ bản', subject: 'Vật lý', grade: 'Lớp 11', enrolled: 3, maxStudents: 6, feePerSession: 1700000, status: 'teaching' },
  { id: 11, name: 'Toán lớp 8 cơ bản', subject: 'Toán học', grade: 'Lớp 8', enrolled: 4, maxStudents: 5, feePerSession: 1500000, status: 'completed' },
  { id: 12, name: 'Địa lý 12 ôn thi', subject: 'Địa lý', grade: 'Lớp 12', enrolled: 5, maxStudents: 8, feePerSession: 1400000, status: 'recruiting' },
]

const STATUS_CONFIG: Record<ClassStatus, { label: string; className: string }> = {
  recruiting: { label: 'Đang tuyển sinh', className: 'bg-blue-100 text-blue-700' },
  teaching:   { label: 'Đang dạy',        className: 'bg-green-100 text-green-700' },
  completed:  { label: 'Hoàn thành',      className: 'bg-slate-100 text-slate-500' },
  pending:  { label: 'Chờ duyệt',      className: 'bg-yellow-100 text-yellow-500' },
}

const PAGE_SIZE = 4

function formatFee(fee: number) {
  return fee.toLocaleString('vi-VN') + 'đ/Khóa'
}

export function TutorClasses() {
  const [classes, setClasses] = useState<TutorClass[]>(MOCK_CLASSES)
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const totalPages = Math.ceil(classes.length / PAGE_SIZE)
  const paginated = classes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalClasses   = classes.length
  const teachingCount  = classes.filter(c => c.status === 'teaching').length
  const completedCount = classes.filter(c => c.status === 'completed').length
  const pendingCount   = classes.filter(c => c.status === 'pending').length

  const handleDelete = (id: number) => {
    setClasses(prev => prev.filter(c => c.id !== id))
    setDeleteId(null)
    const newTotal = classes.length - 1
    const newTotalPages = Math.ceil(newTotal / PAGE_SIZE)
    if (page > newTotalPages && newTotalPages > 0) setPage(newTotalPages)
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

          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              iconBg="bg-blue-100"
              label="Tổng số lớp"
              value={totalClasses}
            />
            <StatCard
              icon={<svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="bg-sky-100"
              label="Lớp đang dạy"
              value={teachingCount}
            />
            <StatCard
              icon={<svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="bg-yellow-100"
              label="Chờ duyệt"
              value={pendingCount}
            />
            <StatCard
              icon={<svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="bg-rose-100"
              label="Lớp đã kết thúc"
              value={completedCount}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
                {paginated.map((cls, idx) => (
                  <tr key={cls.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx === paginated.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-4 font-semibold text-slate-800 max-w-[160px]">{cls.name}</td>
                    <td className="px-4 py-4 text-slate-500">{cls.subject}</td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{cls.grade}</td>
                    <td className="px-4 py-4 min-w-[90px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-700 font-medium">{cls.enrolled}/{cls.maxStudents}</span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${(cls.enrolled / cls.maxStudents) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-blue-700 font-semibold whitespace-nowrap">{formatFee(cls.feePerSession)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_CONFIG[cls.status].className}`}>
                        {STATUS_CONFIG[cls.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => window.location.href = `/tutor/class/new`}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => window.location.href = `/tutor/class/${cls.id}`}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteId(cls.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, classes.length)} – {Math.min(page * PAGE_SIZE, classes.length)} trong số {classes.length} lớp học
              </span>
              <div className="flex items-center gap-1">
                <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </PageBtn>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <PageBtn key={p} onClick={() => setPage(p)} active={p === page}>{p}</PageBtn>
                ))}
                <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </PageBtn>
              </div>
            </div>
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
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
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
    <button
      onClick={onClick}
      disabled={disabled}
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
