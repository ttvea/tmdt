import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { getMediaUrl } from '../../api/axios'
import {
  adminGetClassEnrollments,
  adminGetClassDetail,
  adminReviewClass,
  type ClassResponse,
  type EnrollmentResponse,
} from '../../api/classApi'
import { getTutorProfile, type TutorProfileResponse } from '../../api/tutorProfile'

type ReviewAction = 'approve' | 'reject'

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ duyệt', className: 'bg-red-50 text-red-600 border-red-100' },
  APPROVED: { label: 'Đã phê duyệt', className: 'bg-green-50 text-green-700 border-green-100' },
  REJECTED: { label: 'Đã từ chối', className: 'bg-red-50 text-red-600 border-red-100' },
}

const modeLabels: Record<string, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
}

export function AdminClassDetail() {
  const classId = useMemo(() => Number(window.location.pathname.split('/').pop()), [])
  const [classDetail, setClassDetail] = useState<ClassResponse | null>(null)
  const [tutor, setTutor] = useState<TutorProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState<ReviewAction | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(classId)) {
      setError('Không tìm thấy lớp học.')
      setLoading(false)
      return
    }

    setLoading(true)
    adminGetClassDetail(classId)
      .then(async data => {
        setClassDetail(data)
        if (data.approvalStatus === 'APPROVED') {
          setLoadingEnrollments(true)
          adminGetClassEnrollments(data.id)
            .then(page => setEnrollments(page.content))
            .catch(() => setEnrollments([]))
            .finally(() => setLoadingEnrollments(false))
        } else {
          setEnrollments([])
        }
        try {
          const tutorProfile = await getTutorProfile(data.tutorId)
          setTutor(tutorProfile)
        } catch {
          setTutor(null)
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Không tải được chi tiết lớp học.')
        setLoading(false)
      })
  }, [classId])

  const handleReview = async (action: ReviewAction) => {
    if (!classDetail) return
    if (action === 'reject' && !rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối.')
      return
    }

    setReviewing(action)
    try {
      const updated = await adminReviewClass(
        classDetail.id,
        action === 'approve',
        action === 'reject' ? rejectReason.trim() : undefined
      )
      setClassDetail(updated)
      if (updated.approvalStatus === 'APPROVED') {
        setLoadingEnrollments(true)
        adminGetClassEnrollments(updated.id)
          .then(page => setEnrollments(page.content))
          .catch(() => setEnrollments([]))
          .finally(() => setLoadingEnrollments(false))
      } else {
        setEnrollments([])
      }
      setRejectReason('')
      setShowRejectReason(false)
    } catch {
      alert('Thao tác thất bại.')
    } finally {
      setReviewing(null)
    }
  }

  return (
    <AdminLayout activePath="/admin/classes">
      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">
          Đang tải chi tiết lớp học...
        </div>
      ) : error || !classDetail ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error || 'Không tìm thấy lớp học.'}
        </div>
      ) : (
        <div className="pb-24">
          <div className="mb-5 flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => window.location.href = '/admin/classes'}
              className="mr-2 inline-flex h-8 items-center gap-1.5 rounded border border-slate-300 px-3 font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
            >
              <BackIcon /> Quay lại
            </button>
            <a href="/admin/classes" className="font-medium text-slate-600 hover:text-blue-700">
              Danh sách lớp học
            </a>
            <span>/</span>
            <span className="font-semibold text-blue-700">Chi tiết lớp (CLS-{classDetail.id})</span>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-6">
            <div className="space-y-5">
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">{classDetail.title}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {classDetail.subjectName || 'Môn học'} - {classDetail.gradeLevelName || 'Cấp độ'}
                </p>
                <StatusBadge approvalStatus={classDetail.approvalStatus} />
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <SectionTitle icon={<InfoIcon />} title="Thông tin chi tiết" />
                <div className="mt-5 grid grid-cols-2 gap-x-10 gap-y-5">
                  <DetailItem label="Môn học" value={classDetail.subjectName || '---'} />
                  <DetailItem label="Cấp độ" value={classDetail.gradeLevelName || '---'} />
                  <DetailItem label="Số lượng học sinh tối đa" value={`${classDetail.maxStudents} học sinh`} />
                  <DetailItem label="Tổng số buổi" value={`${classDetail.totalSessions ?? 0} buổi`} />
                  <DetailItem label="Học phí" value={formatCurrency(classDetail.pricePerCourse)} />
                  <DetailItem label="Hình thức" value={modeLabels[classDetail.teachingMode] ?? classDetail.teachingMode} />
                  <DetailItem label="Địa điểm" value={formatLocation(classDetail)} />
                </div>
                <div className="mt-7 border-t border-slate-100 pt-5">
                  <p className="text-xs font-extrabold uppercase text-blue-700">Mô tả khóa học</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {classDetail.description || 'Chưa có mô tả.'}
                  </p>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <SectionTitle icon={<CalendarIcon />} title="Lịch học" />
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {classDetail.schedules.length > 0 ? (
                    classDetail.schedules.map(schedule => (
                      <div key={schedule.id} className="flex min-h-[64px] items-center gap-3 rounded bg-slate-100 px-3 py-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-xs font-bold text-white">
                          T{schedule.dayOfWeek === 8 ? 'CN' : schedule.dayOfWeek}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{schedule.dayLabel}</p>
                          <p className="text-xs text-slate-600">{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Chưa có lịch học.</p>
                  )}
                </div>
              </section>

              {classDetail.approvalStatus === 'REJECTED' && classDetail.rejectReason && (
                <section className="rounded-lg border border-red-100 bg-red-50 p-5 text-sm text-red-700">
                  <p className="font-bold">Lý do từ chối</p>
                  <p className="mt-1">{classDetail.rejectReason}</p>
                </section>
              )}

              {classDetail.approvalStatus === 'APPROVED' && (
                <StudentList enrollments={enrollments} loading={loadingEnrollments} />
              )}
            </div>

            <TutorCard tutor={tutor} tutorId={classDetail.tutorId} />
          </div>

          {classDetail.approvalStatus === 'PENDING' && (
            <div className="fixed bottom-0 left-[232px] right-0 z-20 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-6px_20px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 text-xs text-slate-500">
                  <span>Đang xem lớp: </span>
                  <span className="font-semibold text-blue-700">{classDetail.title}</span>
                  <p className="mt-0.5">Lớp được khởi tạo vào {formatDate(classDetail.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {showRejectReason && (
                    <div className="relative">
                      <input
                        value={rejectReason}
                        onChange={event => setRejectReason(event.target.value)}
                        placeholder="Lý do từ chối"
                        className="h-11 w-56 rounded border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        autoFocus
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => showRejectReason ? handleReview('reject') : setShowRejectReason(true)}
                    disabled={reviewing !== null}
                    className="inline-flex h-11 items-center gap-2 rounded border border-red-400 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <XIcon /> Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview('approve')}
                    disabled={reviewing !== null}
                    className="inline-flex h-11 items-center gap-2 rounded bg-blue-700 px-6 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
                  >
                    <CheckIcon /> Phê duyệt lớp học
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}

function TutorCard({ tutor, tutorId }: { tutor: TutorProfileResponse | null; tutorId: number }) {
  const name = tutor?.fullName || `Gia sư #${tutorId}`
  const avatar = getMediaUrl(tutor?.avatar)

  return (
    <aside className="self-start overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="h-16 bg-blue-700" />
      <div className="-mt-9 px-4 pb-4 text-center">
        {avatar ? (
          <img src={avatar} alt={name} className="mx-auto h-[72px] w-[72px] rounded-lg border-4 border-white object-cover shadow-sm" />
        ) : (
          <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-lg border-4 border-white bg-blue-100 text-xl font-bold text-blue-700 shadow-sm">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <h2 className="mt-2 text-sm font-bold text-slate-950">{name}</h2>
        <p className="text-xs text-slate-500">{tutor?.email || 'Chưa có email'}</p>

        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">★ 4.9/5.0</span>
          {tutor?.isVerified && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Đã xác minh</span>
          )}
        </div>

        <div className="mt-4 space-y-3 text-left">
          <TutorInfo icon={<BriefcaseIcon />} label="Kinh nghiệm" value={tutor?.experience || 'Chưa cập nhật'} />
          <TutorInfo icon={<BookIcon />} label="Học vấn" value={formatEducation(tutor)} />
          <TutorInfo icon={<ShieldIcon />} label="Trạng thái hồ sơ" value={tutor?.isVerified ? 'Hồ sơ đầy đủ, CMND/CCCD hợp lệ' : 'Đang chờ xác minh'} />
        </div>
      </div>
    </aside>
  )
}

function StudentList({ enrollments, loading }: { enrollments: EnrollmentResponse[]; loading: boolean }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <SectionTitle icon={<StudentsIcon />} title="Danh sách học viên" />

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-500">Đang tải danh sách học viên...</div>
      ) : enrollments.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">Chưa có học viên nào.</div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-1 py-3 font-bold text-slate-700">Học viên</th>
                <th className="px-3 py-3 font-bold text-slate-700">Email</th>
                <th className="px-3 py-3 font-bold text-slate-700">SĐT</th>
                <th className="px-3 py-3 font-bold text-slate-700">Ngày ghi danh</th>
                <th className="px-3 py-3 font-bold text-slate-700">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(enrollment => (
                <tr key={enrollment.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-1 py-4">
                    <div className="flex items-center gap-3">
                      <StudentAvatar enrollment={enrollment} />
                      <span className="font-medium text-slate-900">{enrollment.studentName || `Học viên #${enrollment.studentId}`}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-slate-700">{enrollment.studentEmail || '---'}</td>
                  <td className="px-3 py-4 text-slate-700">{enrollment.studentPhone || '---'}</td>
                  <td className="px-3 py-4 text-slate-700">{formatDate(enrollment.createdAt)}</td>
                  <td className="px-3 py-4">
                    <EnrollmentStatusBadge status={enrollment.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function StudentAvatar({ enrollment }: { enrollment: EnrollmentResponse }) {
  const name = enrollment.studentName || `Học viên #${enrollment.studentId}`
  const avatar = getMediaUrl(enrollment.studentAvatar)

  if (avatar) {
    return <img src={avatar} alt={name} className="h-10 w-10 rounded-xl object-cover" />
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-800">
      {getInitials(name)}
    </span>
  )
}

function EnrollmentStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; className: string }> = {
    PAID: { label: 'Đã thanh toán', className: 'bg-cyan-100 text-cyan-800' },
    APPROVED: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800' },
    PENDING: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800' },
    REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-700' },
    CANCELLED: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600' },
  }
  const badge = statusMap[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' }

  return (
    <span className={`inline-flex min-w-[96px] justify-center rounded px-2.5 py-1 text-[11px] font-extrabold uppercase ${badge.className}`}>
      {badge.label}
    </span>
  )
}

function StatusBadge({ approvalStatus }: { approvalStatus: string }) {
  const badge = statusLabels[approvalStatus] ?? { label: approvalStatus, className: 'bg-slate-50 text-slate-600 border-slate-100' }
  return (
    <span className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-base font-bold text-slate-900">
      <span className="text-blue-700">{icon}</span>
      {title}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase text-blue-700">{label}</p>
      <p className="mt-1 text-sm font-normal text-slate-800">{value}</p>
    </div>
  )
}

function TutorInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-blue-700">{icon}</span>
      <div>
        <p className="text-xs font-bold text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-600">{value}</p>
      </div>
    </div>
  )
}

function formatLocation(classDetail: ClassResponse) {
  return [classDetail.address, classDetail.city].filter(Boolean).join(', ') || 'Chưa cập nhật'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatEducation(tutor: TutorProfileResponse | null) {
  if (!tutor) return 'Chưa cập nhật'
  return [tutor.university || tutor.graduatedSchool, tutor.major || tutor.teachMajor].filter(Boolean).join(', ') || 'Chưa cập nhật'
}

function formatTime(time: string) {
  return time?.slice(0, 5) || '--:--'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN')
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'HV'
}

function InfoIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="2" /><path strokeLinecap="round" strokeWidth="2" d="M12 11v5M12 8h.01" /></svg>
}

function StudentsIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}

function BackIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
}

function CalendarIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2" strokeWidth="2" /><path strokeLinecap="round" strokeWidth="2" d="M8 2v4M16 2v4M3 10h18" /></svg>
}

function BriefcaseIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" strokeWidth="2" /><path strokeLinecap="round" strokeWidth="2" d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></svg>
}

function BookIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" /></svg>
}

function ShieldIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
}

function CheckIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M5 13l4 4L19 7" /></svg>
}

function XIcon() {
  return <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M6 18L18 6M6 6l12 12" /></svg>
}
