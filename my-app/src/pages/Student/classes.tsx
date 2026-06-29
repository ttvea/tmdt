import { useEffect, useMemo, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import {
  getClassDetail,
  getMyEnrollments,
  type ClassResponse,
  type EnrollmentResponse,
} from '../../api/classApi'
import { getMediaUrl } from '../../api/axios'
import { getTutorProfile } from '../../api/tutorProfile'

type ClassTab = 'all' | 'learning' | 'waiting-start' | 'pending' | 'completed' | 'inactive'

type StudentClassItem = {
  enrollment: EnrollmentResponse
  classDetail: ClassResponse | null
  teacherName: string
}

const PAGE_SIZE = 6
const ENROLLMENT_PAGE_SIZE = 100

const TABS: Array<{ key: ClassTab; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'learning', label: 'Đang học' },
  { key: 'waiting-start', label: 'Chờ bắt đầu' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'inactive', label: 'Không hoạt động' },
]

const ENROLLMENT_STATUS = {
  PENDING: { label: 'Chờ gia sư duyệt', className: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: 'Chờ thanh toán', className: 'bg-blue-50 text-blue-700' },
  CASH_REQUESTED: { label: 'Chờ xác nhận tiền mặt', className: 'bg-violet-50 text-violet-700' },
  PAID: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: 'Đã từ chối', className: 'bg-rose-50 text-rose-700' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600' },
} as const

async function getAllMyEnrollments() {
  const firstPage = await getMyEnrollments(0, ENROLLMENT_PAGE_SIZE)
  if (firstPage.totalPages <= 1) return firstPage.content

  const restPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      getMyEnrollments(index + 1, ENROLLMENT_PAGE_SIZE)
    )
  )

  return [firstPage, ...restPages].flatMap((pageData) => pageData.content)
}

async function loadStudentClasses(): Promise<StudentClassItem[]> {
  const enrollments = await getAllMyEnrollments()

  return Promise.all(
    enrollments.map(async (enrollment) => {
      try {
        const classDetail = await getClassDetail(enrollment.classId)
        let teacherName = 'Chưa cập nhật'

        try {
          const tutor = await getTutorProfile(classDetail.tutorId)
          teacherName = tutor.fullName
        } catch {
        }

        return { enrollment, classDetail, teacherName }
      } catch {
        return { enrollment, classDetail: null, teacherName: 'Chưa cập nhật' }
      }
    })
  )
}

function getItemTab(item: StudentClassItem): Exclude<ClassTab, 'all'> {
  if (item.enrollment.status === 'REJECTED' || item.enrollment.status === 'CANCELLED') {
    return 'inactive'
  }
  if (item.enrollment.status !== 'PAID') return 'pending'
  if (item.classDetail?.status === 'COMPLETED') return 'completed'
  if (item.classDetail?.status === 'OPEN') return 'waiting-start'
  return 'learning'
}

function isWaitingClassStart(item: StudentClassItem) {
  return item.enrollment.status === 'PAID' && item.classDetail?.status === 'OPEN'
}

function getStudentClassStatus(item: StudentClassItem) {
  const status = ENROLLMENT_STATUS[item.enrollment.status]
  const itemTab = getItemTab(item)

  if (itemTab === 'completed') {
    return { label: 'Đã hoàn thành', className: 'bg-slate-100 text-slate-700' }
  }

  if (isWaitingClassStart(item)) {
    return { label: 'Chờ lớp bắt đầu', className: 'bg-amber-50 text-amber-700' }
  }

  if (itemTab === 'learning') {
    return { label: 'Đang học', className: 'bg-emerald-100 text-emerald-700' }
  }

  return status
}

function formatMoney(value: number | null | undefined) {
  if (value == null) return 'Chưa cập nhật'
  return `${value.toLocaleString('vi-VN')} đ`
}

function formatSchedule(classDetail: ClassResponse | null) {
  if (!classDetail?.schedules?.length) return 'Chưa cập nhật lịch học'

  return classDetail.schedules
    .map((schedule) => {
      const time = `${schedule.startTime.slice(0, 5)} - ${schedule.endTime.slice(0, 5)}`
      return `${schedule.dayLabel}, ${time}`
    })
    .join(' • ')
}

function groupSchedules(classDetail: ClassResponse | null) {
  if (!classDetail?.schedules?.length) return []

  const groups = new Map<string, string[]>()
  classDetail.schedules.forEach((schedule) => {
    const time = `${schedule.startTime.slice(0, 5)} - ${schedule.endTime.slice(0, 5)}`
    const days = groups.get(time) ?? []
    days.push(schedule.dayLabel)
    groups.set(time, days)
  })

  return Array.from(groups, ([time, days]) => {
    const uniqueDays = [...new Set(days)]

    return {
      time,
      days: uniqueDays.length === 7 ? 'Cả tuần' : uniqueDays.join(', '),
    }
  })
}

export function StudentClassCard({ item }: { item: StudentClassItem }) {
  const { enrollment, classDetail, teacherName } = item
  const thumbnail = getMediaUrl(classDetail?.thumbnailUrl)
  const itemTab = getItemTab(item)
  const classStatus = getStudentClassStatus(item)

  return (
    <article className="flex min-h-[310px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="relative h-32 bg-slate-100">
        {thumbnail ? (
          <img src={thumbnail} alt={classDetail?.title || enrollment.classTitle} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3 2 8l10 5 10-5-10-5ZM4 12v5l8 4 8-4v-5" />
            </svg>
          </div>
        )}
        <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${classStatus.className}`}>
          {classStatus.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {classDetail?.subjectName || 'Môn học'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {classDetail?.gradeLevelName || 'Cấp học'}
          </span>
        </div>

        <h2 className="line-clamp-2 text-lg font-bold leading-6 text-slate-950">
          {classDetail?.title || enrollment.classTitle}
        </h2>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            </svg>
            <span>Gia sư: <strong className="font-semibold text-slate-800">{teacherName}</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3M4 11h16M5 5h14a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2Z" />
            </svg>
            <span className="line-clamp-2">{formatSchedule(classDetail)}</span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>
              {classDetail?.teachingMode === 'OFFLINE'
                ? `Offline${classDetail.city ? ` • ${classDetail.city}` : ''}`
                : 'Online'}
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="font-bold text-blue-700">{formatMoney(classDetail?.pricePerCourse)}</p>
            <p className="text-xs text-slate-500">{classDetail?.totalSessions || 0} buổi học</p>
          </div>

          {itemTab === 'learning' ? (
            <a href="/student/schedule" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
              Xem lịch học
            </a>
          ) : isWaitingClassStart(item) ? (
            <span className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              Chờ bắt đầu
            </span>
          ) : itemTab === 'pending' ? (
            <a href="/student/enrollments" className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              Xem thanh toán
            </a>
          ) : (
            <span className="text-xs font-medium text-slate-500">
              Đăng ký {new Date(enrollment.createdAt).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

function StudentClassRow({
  item,
  onView,
}: {
  item: StudentClassItem
  onView: (item: StudentClassItem) => void
}) {
  const { enrollment, classDetail, teacherName } = item
  const itemTab = getItemTab(item)
  const thumbnail = getMediaUrl(classDetail?.thumbnailUrl)
  const classStatus = getStudentClassStatus(item)

  return (
    <tr className="border-t border-slate-100 transition hover:bg-slate-50">
      <td className="px-5 py-4">
        <div className="flex min-w-[230px] items-center gap-3">
          <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-300">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={classDetail?.title || enrollment.classTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3 2 8l10 5 10-5-10-5ZM4 12v5l8 4 8-4v-5" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 font-semibold text-slate-900">
              {classDetail?.title || enrollment.classTitle}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {classDetail?.teachingMode === 'OFFLINE'
                ? `Offline${classDetail.city ? ` • ${classDetail.city}` : ''}`
                : 'Online'}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="min-w-[130px]">
          <p className="font-semibold text-slate-800">{classDetail?.subjectName || 'Môn học'}</p>
          <p className="mt-1 text-xs text-slate-500">{classDetail?.gradeLevelName || 'Cấp học'}</p>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="block min-w-[120px] font-medium text-slate-700">{teacherName}</span>
      </td>

      <td className="px-5 py-4 whitespace-nowrap">
        <p className="font-bold text-blue-700">{formatMoney(classDetail?.pricePerCourse)}</p>
        <p className="mt-1 text-xs text-slate-500">{classDetail?.totalSessions || 0} buổi</p>
      </td>

      <td className="px-5 py-4 whitespace-nowrap">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${classStatus.className}`}>
          {classStatus.label}
        </span>
      </td>

      <td className="px-5 py-4 text-right whitespace-nowrap">
        <div className="ml-auto grid w-[136px] grid-cols-[36px_92px] items-center justify-end gap-2">
          <button
            type="button"
            title="Xem chi tiết lớp học"
            onClick={() => onView(item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
          {itemTab === 'learning' ? (
            <a
              href="/student/schedule"
              className="inline-flex w-[92px] items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-blue-800"
            >
              Xem lịch
            </a>
          ) : isWaitingClassStart(item) ? (
            <span className="inline-flex w-[92px] items-center justify-center rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-700">
              Chờ bắt đầu
            </span>
          ) : itemTab === 'pending' ? (
            <a
              href="/student/enrollments"
              className="inline-flex w-[92px] items-center justify-center rounded-lg border border-blue-600 px-3 py-2 text-center text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              Thanh toán
            </a>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      </td>
    </tr>
  )
}

function StudentClassDetailModal({
  item,
  onClose,
}: {
  item: StudentClassItem
  onClose: () => void
}) {
  const { enrollment, classDetail, teacherName } = item
  const thumbnail = getMediaUrl(classDetail?.thumbnailUrl)
  const status = getStudentClassStatus(item)
  const scheduleGroups = groupSchedules(classDetail)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Chi tiết lớp học</h2>
            <p className="mt-1 text-sm text-slate-500">Thông tin lớp và trạng thái đăng ký của bạn</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết lớp học"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-300 sm:w-52">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={classDetail?.title || enrollment.classTitle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg className="h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3 2 8l10 5 10-5-10-5ZM4 12v5l8 4 8-4v-5" />
                </svg>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {classDetail?.subjectName || 'Môn học'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {classDetail?.gradeLevelName || 'Cấp học'}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-bold text-slate-950">
                {classDetail?.title || enrollment.classTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {classDetail?.description || 'Lớp học chưa có mô tả.'}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Gia sư</dt>
              <dd className="mt-1 font-semibold text-slate-800">{teacherName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Học phí</dt>
              <dd className="mt-1 font-semibold text-blue-700">{formatMoney(classDetail?.pricePerCourse)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Hình thức</dt>
              <dd className="mt-1 font-semibold text-slate-800">
                {classDetail?.teachingMode === 'OFFLINE' ? 'Offline' : 'Online'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Địa điểm</dt>
              <dd className="mt-1 font-semibold text-slate-800">
                {classDetail?.teachingMode === 'OFFLINE'
                  ? [classDetail.address, classDetail.city].filter(Boolean).join(', ') || 'Chưa cập nhật'
                  : 'Học trực tuyến'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Số buổi</dt>
              <dd className="mt-1 font-semibold text-slate-800">{classDetail?.totalSessions || 0} buổi</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Sĩ số</dt>
              <dd className="mt-1 font-semibold text-slate-800">
                {classDetail?.currentStudents || 0}/{classDetail?.maxStudents || 0} học viên
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-slate-400">Lịch học</dt>
              <dd className="mt-2 space-y-3">
                {scheduleGroups.length > 0 ? (
                  scheduleGroups.map((schedule) => (
                    <div key={`${schedule.days}-${schedule.time}`}>
                      <p className="text-base font-bold text-slate-900">{schedule.days}</p>
                      <p className="mt-0.5 text-sm font-normal text-slate-500">{schedule.time}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-500">Chưa cập nhật lịch học</p>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  path,
}: {
  label: string
  value: number
  color: string
  path: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
        </svg>
      </div>
    </div>
  )
}

export function StudentClasses() {
  const [items, setItems] = useState<StudentClassItem[]>([])
  const [activeTab, setActiveTab] = useState<ClassTab>('all')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState<StudentClassItem | null>(null)

  useEffect(() => {
    loadStudentClasses()
      .then(setItems)
      .catch(() => setError('Không thể tải danh sách lớp học. Vui lòng thử lại.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setPage(0)
  }, [activeTab])

  const stats = useMemo(() => ({
    total: items.length,
    learning: items.filter((item) => getItemTab(item) === 'learning').length,
    pending: items.filter((item) => getItemTab(item) === 'pending').length,
    completed: items.filter((item) => getItemTab(item) === 'completed').length,
  }), [items])

  const filteredItems = useMemo(
    () => activeTab === 'all' ? items : items.filter((item) => getItemTab(item) === activeTab),
    [activeTab, items]
  )

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const pageItems = filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <AccountLayout activePath="/student/classes">
      <div className="min-h-screen bg-slate-50 px-5 py-8 text-left sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-blue-900">Lớp học</p>

              <p className="mt-1 text-sm text-slate-500">Theo dõi các lớp đã đăng ký và quá trình học tập của bạn.</p>
            </div>
            <a href="/discover/classes" className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
              Tìm lớp mới
            </a>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Tổng lớp đăng ký" value={stats.total} color="bg-blue-100 text-blue-700" path="M12 3 2 8l10 5 10-5-10-5ZM4 12v5l8 4 8-4v-5" />
            <StatCard label="Lớp đang học" value={stats.learning} color="bg-emerald-100 text-emerald-700" path="M14.752 11.168 11.555 9.04A1 1 0 0 0 10 9.873v4.254a1 1 0 0 0 1.555.832l3.197-2.127a1 1 0 0 0 0-1.664ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            <StatCard label="Chờ xử lý" value={stats.pending} color="bg-amber-100 text-amber-700" path="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            <StatCard label="Đã hoàn thành" value={stats.completed} color="bg-violet-100 text-violet-700" path="m9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </div>

          <div className="mt-6 overflow-x-auto rounded-t-lg border border-b-0 border-slate-200 bg-white">
            <div className="flex min-w-[720px]">
              {TABS.map((tab) => {
                const count = tab.key === 'all'
                  ? stats.total
                  : items.filter((item) => getItemTab(item) === tab.key).length

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-700 bg-blue-50/60 text-blue-700'
                        : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    {tab.label} <span className="ml-1 text-xs">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-white py-16 text-center text-slate-500">
              Đang tải lớp học...
            </div>
          ) : pageItems.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3 2 8l10 5 10-5-10-5ZM4 12v5l8 4 8-4v-5" />
              </svg>
              <p className="mt-3 font-semibold text-slate-700">Chưa có lớp học trong mục này</p>
              <a href="/discover/classes" className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline">
                Khám phá lớp học
              </a>
            </div>
          ) : (
            <>
              <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-4">Lớp học</th>
                        <th className="px-5 py-4">Môn học</th>
                        <th className="px-5 py-4">Gia sư</th>
                        <th className="px-5 py-4">Học phí</th>
                        <th className="px-5 py-4">Trạng thái</th>
                           <th className="px-5 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((item) => (
                        <StudentClassRow
                          key={item.enrollment.id}
                          item={item}
                          onView={setSelectedItem}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 ? (
                <div className="mt-7 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Trang {page + 1}/{totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page === 0}
                      onClick={() => setPage((current) => Math.max(0, current - 1))}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      disabled={page + 1 >= totalPages}
                      onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {selectedItem ? (
        <StudentClassDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </AccountLayout>
  )
}
