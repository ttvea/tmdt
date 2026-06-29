import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { AccountLayout } from '../../components/AccountLayout'
import {
  getMyClassDetail, getEnrollmentsOfClass, reviewEnrollment,
  updateClassStatus,
  type ClassResponse, type EnrollmentResponse, type EnrollmentStatus,
} from '../../api/classApi'
import { getAllSubjects, type SubjectOption } from '../../api/tutorProfile'
import { getAllGradeLevels, type GradeLevelOption } from '../../api/classApi'

function getClassIdFromUrl(): number {
  const parts = window.location.pathname.split('/')
  return Number(parts[parts.length - 1])
}

const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; className: string }> = {
  PENDING:   { label: 'Chờ duyệt',      className: 'bg-yellow-100 text-yellow-700' },
  APPROVED:  { label: 'Đã duyệt',       className: 'bg-blue-100 text-blue-700' },
  PAID:      { label: 'Đã nộp học phí', className: 'bg-green-100 text-green-700' },
  CASH_REQUESTED: { label: 'Chờ xác nhận tiền mặt', className: 'bg-orange-100 text-orange-700' },
  REJECTED:  { label: 'Từ chối',        className: 'bg-red-100 text-red-600' },
  CANCELLED: { label: 'Đã huỷ',         className: 'bg-slate-100 text-slate-500' },
}

const CLASS_STATUS_CONFIG = {
  OPEN:      { label: 'Đang tuyển sinh', className: 'bg-blue-100 text-blue-700' },
  CLOSED:    { label: 'Đang dạy',        className: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Hoàn thành',      className: 'bg-slate-100 text-slate-500' },
}

function formatTime(t: string) {
  // "HH:mm:ss" → "HH:mm"
  return t?.slice(0, 5) ?? ''
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function formatFee(fee: number) {
  return fee.toLocaleString('vi-VN') + 'đ/Khóa'
}

function initials(name: string) {
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
]

function isActiveEnrollment(status: EnrollmentStatus) {
  return status === 'APPROVED' || status === 'PAID'
}

export function ClassDetail() {
  const classId = getClassIdFromUrl()

  const [cls, setCls] = useState<ClassResponse | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMenuId, setActionMenuId] = useState<number | null>(null)
  const [subjectMap, setSubjectMap] = useState<Record<number, string>>({})
  const [gradeMap, setGradeMap] = useState<Record<number, string>>({})
  const [isStartingClass, setIsStartingClass] = useState(false)

  useEffect(() => {
    getAllSubjects().then(data => {
      const m: Record<number, string> = {}
      data.forEach((s: SubjectOption) => { m[s.id] = s.name })
      setSubjectMap(m)
    }).catch(() => {})

    getAllGradeLevels().then(data => {
      const m: Record<number, string> = {}
      data.forEach((g: GradeLevelOption) => { m[g.id] = g.name })
      setGradeMap(m)
    }).catch(() => {})

    Promise.all([
      getMyClassDetail(classId),
      getEnrollmentsOfClass(classId),
    ]).then(([classData, enrollData]) => {
      setCls(classData)
      setEnrollments(enrollData.content)
      setLoading(false)
    }).catch(() => {
      setError('Không thể tải thông tin lớp học.')
      setLoading(false)
    })
  }, [classId])

  const handleReview = async (enrollmentId: number, approved: boolean) => {
    try {
      const updated = await reviewEnrollment(enrollmentId, approved)
      setEnrollments(prev => {
        const nextEnrollments = prev.map(e => e.id === enrollmentId ? updated : e)
        const activeCount = nextEnrollments.filter(e => isActiveEnrollment(e.status)).length

        if (cls) {
          setCls({
            ...cls,
            status: approved && cls.approvalStatus === 'APPROVED' && cls.status === 'OPEN' && activeCount >= cls.maxStudents
              ? 'CLOSED'
              : cls.status,
            currentStudents: activeCount,
          })
        }

        if (cls && approved && cls.approvalStatus === 'APPROVED' && cls.status === 'OPEN' && activeCount >= cls.maxStudents) {
          toast.success('Lớp đã đủ học viên và chuyển sang đang dạy.')
        }

        return nextEnrollments
      })
    } catch {
      toast.error('Thao tác thất bại. Vui lòng thử lại.')
    }
    setActionMenuId(null)
  }

  const handleStartClass = async () => {
    if (!cls || isStartingClass) return
    const minimumStudents = Math.max(1, Math.ceil(cls.maxStudents / 2))

    if (cls.currentStudents < minimumStudents) {
      toast.error(`Cần ít nhất ${minimumStudents} học viên để bắt đầu lớp.`)
      return
    }

    setIsStartingClass(true)
    try {
      const updated = await updateClassStatus(cls.id, 'CLOSED')
      setCls(updated)
      toast.success('Lớp học đã bắt đầu.')
    } catch {
      toast.error('Không thể bắt đầu lớp học. Vui lòng thử lại.')
    } finally {
      setIsStartingClass(false)
    }
  }

  if (loading) return (
    <AccountLayout activePath="/tutor/classes">
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Đang tải...
      </div>
    </AccountLayout>
  )

  if (error || !cls) return (
    <AccountLayout activePath="/tutor/classes">
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || 'Không tìm thấy lớp học.'}</p>
      </div>
    </AccountLayout>
  )

  const scheduleLabel = (() => {
    if (cls.schedules.length === 0) return '—'
    if (cls.schedules.length === 7) return 'Cả tuần'
    return cls.schedules.map(s => s.dayLabel).join(', ')
  })()
  const timeLabel = cls.schedules.length > 0
    ? `${formatTime(cls.schedules[0].startTime)} - ${formatTime(cls.schedules[0].endTime)}`
    : '—'
  const classStatusCfg = CLASS_STATUS_CONFIG[cls.status] ?? CLASS_STATUS_CONFIG.OPEN
  const subjectName = cls.subjectName || subjectMap[cls.subjectId] || '—'
  const gradeName = cls.gradeLevelName || gradeMap[cls.gradeLevelId] || '—'

  const minimumStudentsToStart = Math.max(1, Math.ceil(cls.maxStudents / 2))
  const canStartClass = cls.approvalStatus === 'APPROVED'
    && cls.status === 'OPEN'
    && cls.currentStudents >= minimumStudentsToStart

  return (
    <AccountLayout activePath="/tutor/classes">
      <div className="min-h-screen bg-slate-50 px-8 py-8 text-left">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-900">  Chi tiết lớp học: {cls.title}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${classStatusCfg.className}`}>
                  {classStatusCfg.label}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {cls.currentStudents}/{cls.maxStudents} học viên
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {cls.approvalStatus === 'PENDING' && (
                <button
                  onClick={() => window.location.href = `/tutor/classes/edit/${cls.id}`}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Chỉnh sửa
                </button>
              )}
              {canStartClass && (
                <button
                  onClick={handleStartClass}
                  disabled={isStartingClass}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  {isStartingClass ? 'Đang bắt đầu...' : 'Bắt đầu lớp học'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Lịch học</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{scheduleLabel || '—'}</p>
                <p className="text-xs text-slate-500">{timeLabel}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tiến độ</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  Buổi 0/{cls.totalSessions ?? '?'}
                </p>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Học phí</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{formatFee(cls.pricePerCourse)}</p>
                <p className="text-xs text-slate-500">Thanh toán theo tháng</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Phòng học</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {cls.teachingMode === 'ONLINE' ? 'Online' : cls.address ?? 'Offline'}
                </p>
                {cls.teachingMode === 'ONLINE' && (
                  <p className="text-xs text-blue-600 hover:underline cursor-pointer">Tham gia ngay</p>
                )}
              </div>
            </div>
          </div>

          <div className="relative rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Danh sách học viên</h2>
              <button className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Thêm học viên
              </button>
            </div>

            {enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm">Chưa có học viên nào đăng ký.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Học viên', 'Số điện thoại', 'Ngày tham gia', 'Trạng thái', 'Thao tác'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enroll, idx) => {
                    const statusCfg = STATUS_CONFIG[enroll.status]
                    const colorClass = AVATAR_COLORS[enroll.studentId % AVATAR_COLORS.length]
                    const shouldOpenMenuUp = idx >= enrollments.length - 2
                    const name = enroll.studentName || `Học viên ${enroll.studentId}`
                    return (
                      <tr key={enroll.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx === enrollments.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {enroll.studentAvatar ? (
                              <img src={enroll.studentAvatar} alt={name}
                                className="w-9 h-9 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                {initials(name)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800">{name}</p>
                              <p className="text-xs text-slate-400">{enroll.studentEmail || `ID: ${enroll.studentId}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{enroll.studentPhone || '—'}</td>
                        <td className="px-5 py-4 text-slate-500">{formatDate(enroll.createdAt)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 relative">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === enroll.id ? null : enroll.id)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                            </svg>
                          </button>
                          {actionMenuId === enroll.id && (
                            <div
                              className={`absolute right-4 z-30 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${
                                shouldOpenMenuUp ? 'bottom-10' : 'top-10'
                              }`}
                            >
                              {enroll.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleReview(enroll.id, true)}
                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors">
                                    ✓ Duyệt
                                  </button>
                                  <button onClick={() => handleReview(enroll.id, false)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                                    ✕ Từ chối
                                  </button>
                                </>
                              )}
                              <button onClick={() => setActionMenuId(null)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
                                Xem hồ sơ
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Thông tin lớp học</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Môn học', value: subjectName },
                  { label: 'Khối lớp', value: gradeName },
                  { label: 'Hình thức', value: cls.teachingMode === 'ONLINE' ? 'Online' : 'Offline' },
                  { label: 'Sĩ số tối đa', value: `${cls.maxStudents} học viên` },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Mô tả lớp học</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {cls.description || <span className="text-slate-400 italic">Chưa có mô tả.</span>}
              </p>
            </div>
          </div>

        </div>
      </div>
    </AccountLayout>
  )
}
