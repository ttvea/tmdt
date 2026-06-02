import { useMemo, useState } from 'react'

export interface ScheduleEvent {
  id: string
  className: string
  subjectName: string
  categoryName?: string | null
  teacherName?: string
  mode: 'ONLINE' | 'OFFLINE'
  address?: string | null
  city?: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface WeeklyScheduleProps {
  title: string
  events: ScheduleEvent[]
  loading?: boolean
  showTeacher?: boolean
  onExport?: () => void
}

const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
const hours = Array.from({ length: 17 }, (_, index) => index + 6)
const startHour = 6
const endHour = 23
const hourHeight = 68
type WeekNavAction = 'prev' | 'today' | 'next'

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function isSameDate(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate()
}

function formatRange(start: Date) {
  const end = addDays(start, 6)
  return `${start.getDate()} - ${end.getDate()} Tháng ${end.getMonth() + 1}, ${end.getFullYear()}`
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function eventStyle(event: ScheduleEvent) {
  const start = timeToMinutes(event.startTime)
  const end = timeToMinutes(event.endTime)
  const top = ((start - startHour * 60) / 60) * hourHeight
  const height = Math.max(((end - start) / 60) * hourHeight, 52)

  return {
    top: `${Math.max(0, top)}px`,
    height: `${Math.min(height, (endHour - startHour) * hourHeight - top)}px`,
  }
}

function eventDurationMinutes(event: ScheduleEvent) {
  return timeToMinutes(event.endTime) - timeToMinutes(event.startTime)
}

function modeLabel(mode: ScheduleEvent['mode']) {
  return mode === 'ONLINE' ? 'ONLINE' : 'OFFLINE'
}

function navButtonClass(active: boolean) {
  return `flex-1 rounded-md px-4 text-sm font-semibold transition sm:flex-none ${
    active
      ? 'bg-blue-700 text-white shadow-sm'
      : 'text-slate-700 hover:bg-white'
  }`
}

function normalizeText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function eventColorClass(categoryName?: string | null) {
  const category = normalizeText(categoryName)

  if (category.includes('nang khieu') || category.includes('talent')) {
    return 'bg-emerald-700'
  }

  if (category.includes('ngoai ngu') || category.includes('language')) {
    return 'bg-cyan-700'
  }

  return 'bg-blue-700'
}

export function WeeklySchedule({
  title,
  events,
  loading = false,
  showTeacher = false,
  onExport,
}: WeeklyScheduleProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [activeNav, setActiveNav] = useState<WeekNavAction>('today')
  const [hoveredEvent, setHoveredEvent] = useState<ScheduleEvent | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const days = useMemo(
    () => dayNames.map((name, index) => ({ name, date: addDays(weekStart, index), dayOfWeek: index + 2 })),
    [weekStart]
  )

  const eventsByDay = useMemo(() => {
    return days.reduce<Record<number, ScheduleEvent[]>>((acc, day) => {
      acc[day.dayOfWeek] = events
        .filter((event) => event.dayOfWeek === day.dayOfWeek)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
      return acc
    }, {})
  }, [days, events])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-left sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-3xl font-bold text-blue-900">{title}</p>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex h-11 overflow-hidden rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setWeekStart((date) => addDays(date, -7))
                  setActiveNav('prev')
                }}
                className={`${navButtonClass(activeNav === 'prev')} sm:min-w-20`}
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeekStart(startOfWeek(new Date()))
                  setActiveNav('today')
                }}
                className={`${navButtonClass(activeNav === 'today')} sm:min-w-24`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeekStart((date) => addDays(date, 7))
                  setActiveNav('next')
                }}
                className={`${navButtonClass(activeNav === 'next')} sm:min-w-20`}
              >
                Sau
              </button>
            </div>

            <p className="text-center text-lg font-bold text-slate-950 lg:min-w-[260px]">
              {formatRange(weekStart)}
            </p>

            <div className="flex w-full items-center gap-2 lg:w-auto">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 lg:w-28 lg:flex-none"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" />
                </svg>
                In lịch
              </button>
              <button
                type="button"
                onClick={onExport}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 lg:w-32 lg:flex-none"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
                </svg>
                Xuất file
              </button>
            </div>
          </div>
        </div>

        <div id="weekly-schedule-print-area" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[76px_repeat(7,minmax(120px,1fr))] border-b border-slate-200 bg-slate-50">
                <div className="flex h-20 items-center justify-center border-r border-slate-200 text-xs font-bold uppercase text-blue-700">
                  Giờ
                </div>
                {days.map((day, index) => {
                  const today = isSameDate(day.date, new Date())
                  return (
                    <div
                      key={day.name}
                      className={`relative flex h-20 flex-col items-center justify-center border-r border-slate-200 last:border-r-0 ${
                        index === 6 ? 'text-red-600' : index === 5 ? 'text-blue-700' : 'text-slate-700'
                      } ${today ? 'ring-2 ring-inset ring-blue-600' : ''}`}
                    >
                      <span className="text-xs font-bold uppercase">{day.name}</span>
                      <span className="text-xl font-bold leading-tight">{day.date.getDate()}</span>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-[76px_repeat(7,minmax(120px,1fr))]">
                <div className="relative border-r border-slate-200 bg-slate-50" style={{ height: `${hours.length * hourHeight}px` }}>
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="flex items-center justify-center border-b border-slate-200 px-2 text-sm font-semibold text-slate-600"
                      style={{ height: `${hourHeight}px` }}
                    >
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {days.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className="relative border-r border-slate-200 last:border-r-0"
                    style={{ height: `${hours.length * hourHeight}px` }}
                  >
                    {hours.map((hour) => (
                      <div key={hour} className="border-b border-slate-100" style={{ height: `${hourHeight}px` }} />
                    ))}

                    {loading ? null : eventsByDay[day.dayOfWeek]?.map((event, index) => {
                      const compact = eventDurationMinutes(event) <= 90

                      return (
                        <div
                          key={`${event.id}-${index}`}
                          onMouseEnter={(e) => {
                            setHoveredEvent(event)
                            setTooltipPosition({ x: e.clientX, y: e.clientY })
                          }}
                          onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHoveredEvent(null)}
                          className={`absolute left-2 right-2 overflow-hidden rounded-lg text-white shadow-lg ${compact ? 'p-2.5' : 'p-3'} ${eventColorClass(event.categoryName)}`}
                          style={eventStyle(event)}
                        >
                          <div className={`flex h-full min-h-0 flex-col overflow-hidden ${compact ? 'gap-0.5' : 'gap-1'}`}>
                            <p
                              className={`${compact ? 'line-clamp-1 text-xs' : 'truncate text-sm'} font-bold leading-tight`}
                              title={event.className}
                            >
                              {event.className}
                            </p>
                            {!compact ? (
                              <p className="truncate text-xs font-semibold leading-tight text-white/85" title={event.subjectName}>
                                Môn học: {event.subjectName || 'Chưa cập nhật'}
                              </p>
                            ) : null}
                            <p className="flex items-center gap-1 text-xs font-semibold leading-tight text-white/90">
                              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                              </svg>
                              <span className="truncate">{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                            </p>
                            {showTeacher && event.teacherName ? (
                              <p className="truncate text-xs font-semibold italic leading-tight text-white/90">
                                GV: {event.teacherName}
                              </p>
                            ) : null}
                            <span className={`${compact ? 'mt-1' : 'mt-auto'} w-fit rounded bg-white px-2 py-0.5 text-[10px] font-black leading-tight tracking-wide text-slate-900`}>
                              {modeLabel(event.mode)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-5 text-sm font-medium text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Đang tải thời khóa biểu...
            </div>
          ) : events.length === 0 ? (
            <div className="border-t border-slate-100 py-6 text-center text-sm font-medium text-slate-500">
              Chưa có lớp học nào trong thời khóa biểu.
            </div>
          ) : null}
        </div>
      </div>
      {hoveredEvent ? (
        <div
          className="pointer-events-none fixed z-[9999] w-64 rounded-lg border border-slate-200 bg-white p-3 text-left text-slate-700 shadow-xl"
          style={{
            left: `${Math.min(tooltipPosition.x + 14, window.innerWidth - 280)}px`,
            top: `${Math.min(tooltipPosition.y + 14, window.innerHeight - 150)}px`,
          }}
        >
          <p className="text-sm font-bold leading-snug text-slate-950">{hoveredEvent.className}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Môn học: {hoveredEvent.subjectName || 'Chưa cập nhật'}</p>
          {showTeacher && hoveredEvent.teacherName ? (
            <p className="mt-1 text-xs font-semibold text-slate-600">Giáo viên: {hoveredEvent.teacherName}</p>
          ) : null}
          <p className="mt-1 text-xs font-semibold text-slate-600">
            Thời gian: {formatTime(hoveredEvent.startTime)} - {formatTime(hoveredEvent.endTime)}
          </p>
          {hoveredEvent.mode === 'OFFLINE' && (hoveredEvent.address || hoveredEvent.city) ? (
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Địa chỉ: {[hoveredEvent.address, hoveredEvent.city].filter(Boolean).join(', ')}
            </p>
          ) : null}
          <p className="mt-2 inline-flex rounded bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-800">
            {modeLabel(hoveredEvent.mode)}
          </p>
        </div>
      ) : null}
    </div>
  )
}
