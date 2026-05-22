import { useEffect, useMemo, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { WeeklySchedule, type ScheduleEvent } from '../../components/WeeklySchedule'
import {
  getClassDetail,
  getMyEnrollments,
  type ClassResponse,
  type EnrollmentResponse,
} from '../../api/classApi'
import { getTutorProfile } from '../../api/tutorProfile'

type ClassWithTeacher = ClassResponse & { teacherName: string }

function classToEvents(cls: ClassWithTeacher): ScheduleEvent[] {
  return cls.schedules.map((schedule) => ({
    id: `${cls.id}-${schedule.id}`,
    className: cls.title,
    subjectName: cls.subjectName,
    categoryName: cls.categoryName,
    teacherName: cls.teacherName,
    mode: cls.teachingMode,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
  }))
}

function exportCsv(events: ScheduleEvent[]) {
  const rows = [
    ['Tên lớp học', 'Môn học', 'Giáo viên', 'Thứ', 'Thời gian', 'Hình thức'],
    ...events.map((event) => [
      event.className,
      event.subjectName,
      event.teacherName || '',
      `Thứ ${event.dayOfWeek}`,
      `${event.startTime.slice(0, 5)} - ${event.endTime.slice(0, 5)}`,
      event.mode === 'ONLINE' ? 'Online' : 'Offline',
    ]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'thoi-khoa-bieu-sinh-vien.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function isTeachingClass(cls: ClassResponse) {
  return cls.approvalStatus === 'APPROVED' && cls.status === 'CLOSED'
}

async function loadStudentClasses(enrollments: EnrollmentResponse[]) {
  const accepted = enrollments.filter((item) => item.status === 'APPROVED' || item.status === 'PAID')
  const details: Array<ClassWithTeacher | null> = await Promise.all(
    accepted.map(async (enrollment) => {
      try {
        const cls = await getClassDetail(enrollment.classId)
        let teacherName = ''
        try {
          const tutor = await getTutorProfile(cls.tutorId)
          teacherName = tutor.fullName
        } catch {
          teacherName = 'Giáo viên'
        }
        return { ...cls, teacherName }
      } catch {
        return null
      }
    })
  )

  return details.filter((item): item is ClassWithTeacher => item !== null && isTeachingClass(item))
}

export function StudentSchedule() {
  const [classes, setClasses] = useState<ClassWithTeacher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMyEnrollments(0, 100)
      .then((data) => loadStudentClasses(data.content))
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setLoading(false))
  }, [])

  const events = useMemo(() => classes.flatMap(classToEvents), [classes])

  return (
    <AccountLayout activePath="/student/schedule">
      <WeeklySchedule
        title="Thời khóa biểu"
        subtitle="Theo dõi lịch học theo tuần với tên lớp, môn học, giáo viên, thời gian và hình thức học."
        events={events}
        loading={loading}
        showTeacher
        onExport={() => exportCsv(events)}
      />
    </AccountLayout>
  )
}
