import { useEffect, useMemo, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { WeeklySchedule, type ScheduleEvent } from '../../components/WeeklySchedule'
import { getMyClasses, type ClassResponse } from '../../api/classApi'

function classToEvents(cls: ClassResponse): ScheduleEvent[] {
  return cls.schedules.map((schedule) => ({
    id: `${cls.id}-${schedule.id}`,
    className: cls.title,
    subjectName: cls.subjectName,
    categoryName: cls.categoryName,
    mode: cls.teachingMode,
    address: cls.address,
    city: cls.city,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
  }))
}

function exportCsv(events: ScheduleEvent[]) {
  const rows = [
    ['Tên lớp học', 'Môn học', 'Thứ', 'Thời gian', 'Hình thức'],
    ...events.map((event) => [
      event.className,
      event.subjectName,
      `Thứ ${event.dayOfWeek}`,
      `${event.startTime.slice(0, 5)} - ${event.endTime.slice(0, 5)}`,
      event.mode === 'ONLINE' ? 'Online' : 'Offline',
    ]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'thoi-khoa-bieu-gia-su.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function isTeachingClass(cls: ClassResponse) {
  return cls.approvalStatus === 'APPROVED' && cls.status === 'CLOSED'
}

export function TutorSchedule() {
  const [classes, setClasses] = useState<ClassResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMyClasses(0, 100)
      .then((data) => setClasses(data.content.filter(isTeachingClass)))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false))
  }, [])

  const events = useMemo(() => classes.flatMap(classToEvents), [classes])

  return (
    <AccountLayout activePath="/tutor/schedule">
      <WeeklySchedule
        title="Thời khóa biểu"
        events={events}
        loading={loading}
        onExport={() => exportCsv(events)}
      />
    </AccountLayout>
  )
}
