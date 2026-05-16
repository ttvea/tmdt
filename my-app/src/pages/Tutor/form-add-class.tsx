import { useState, useEffect } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { getAllSubjects, type SubjectOption } from '../../api/tutorProfile'
import {
  createClass, getAllGradeLevels, getAllCategories,
  type GradeLevelOption, type CategoryOption, type ScheduleRequest,
} from '../../api/classApi'

type TeachMode = 'ONLINE' | 'OFFLINE'
type Period = 'AM' | 'PM'

const DAYS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','CN']
const DAY_OF_WEEK = [2, 3, 4, 5, 6, 7, 8]

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55']

function to24h(hour: string, min: string, period: Period): string {
  let h = parseInt(hour)
  if (period === 'AM' && h === 12) h = 0
  if (period === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${min}`
}

function TimePicker({ hour, min, period, onHour, onMin, onPeriod }: {
  hour: string; min: string; period: Period
  onHour: (v: string) => void; onMin: (v: string) => void; onPeriod: (v: Period) => void
}) {
  return (
    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white divide-x divide-slate-200 w-fit">
      <select value={hour} onChange={e => onHour(e.target.value)}
        className="w-10 py-2 text-sm text-slate-700 bg-transparent focus:outline-none appearance-none text-center">
        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="px-0.5 text-slate-400 font-bold text-sm select-none bg-white">:</span>
      <select value={min} onChange={e => onMin(e.target.value)}
        className="w-10 py-2 text-sm text-slate-700 bg-transparent focus:outline-none appearance-none text-center">
        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={period} onChange={e => onPeriod(e.target.value as Period)}
        className="py-2 px-2 text-sm font-semibold text-slate-700 bg-slate-50 focus:outline-none appearance-none text-center cursor-pointer hover:bg-slate-100 transition-colors">
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

export function FormAddClass() {
  const [className, setClassName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null)
  const [maxStudents, setMaxStudents] = useState('')
  const [description, setDescription] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startHour, setStartHour] = useState('06')
  const [startMin, setStartMin] = useState('00')
  const [startPeriod, setStartPeriod] = useState<Period>('AM')
  const [endHour, setEndHour] = useState('08')
  const [endMin, setEndMin] = useState('00')
  const [endPeriod, setEndPeriod] = useState<Period>('AM')
  const [mode, setMode] = useState<TeachMode>('ONLINE')
  const [fee, setFee] = useState('200.000')
  const [totalSessions, setTotalSessions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([])
  const [allGrades, setAllGrades] = useState<GradeLevelOption[]>([])

  useEffect(() => {
    getAllCategories().then(setCategories).catch(() => {})
    getAllSubjects().then(setAllSubjects).catch(() => {})
    getAllGradeLevels().then(setAllGrades).catch(() => {})
  }, [])

  const filteredSubjects = selectedCategoryId
    ? allSubjects.filter(s => s.category?.id === selectedCategoryId)
    : allSubjects

  const filteredGrades = selectedSubjectId
    ? (allSubjects.find(s => s.id === selectedSubjectId)?.gradeLevels ?? allGrades)
    : allGrades

  const handleCategoryChange = (catId: number) => {
    setSelectedCategoryId(catId)
    setSelectedSubjectId(null)
    setSelectedGradeId(null)
  }

  const toggleDay = (dow: number) =>
    setSelectedDays(prev => prev.includes(dow) ? prev.filter(d => d !== dow) : [...prev, dow])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedDays.length === 0) {
      setError('Vui lòng chọn ít nhất một ngày học.')
      return
    }

    const startTime = to24h(startHour, startMin, startPeriod)
    const endTime = to24h(endHour, endMin, endPeriod)

    if (endTime <= startTime) {
      setError('Giờ kết thúc phải sau giờ bắt đầu.')
      return
    }

    const schedules: ScheduleRequest[] = selectedDays.map(dow => ({
      dayOfWeek: dow,
      startTime,
      endTime,
    }))

    setIsSubmitting(true)
    try {
      await createClass({
        title: className,
        description,
        categoryId: selectedCategoryId,
        subjectId: selectedSubjectId,
        gradeLevelId: selectedGradeId,
        teachingMode: mode,
        pricePerCourse: Number(fee.replace(/\./g, '')),
        totalSessions: totalSessions ? Number(totalSessions) : null,
        maxStudents: Number(maxStudents),
        address: null,
        city: null,
        thumbnailUrl: null,
        schedules,
      })
      window.location.href = '/tutor/classes'
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Đăng lớp thất bại. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AccountLayout activePath="/tutor/classes">
      <div className="min-h-screen bg-slate-50 px-8 py-8 text-left">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <p className="text-3xl font-bold text-slate-900">Đăng tin lớp học mới</p>
            <p className="text-sm text-slate-500 mt-1">Điền thông tin chi tiết để kết nối với học viên phù hợp nhất.</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex gap-6 items-start">
              <div className="min-w-0 w-[600px] shrink-0 flex flex-col gap-5">

                <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5">
                  <SectionHeader icon="doc" title="Thông tin cơ bản" />

                  <FormField label="Tên lớp học" required>
                    <input value={className} onChange={e => setClassName(e.target.value)}
                      placeholder="Ví dụ: Toán nâng cao lớp 9 luyện thi vào 10"
                      required className="input-base" />
                  </FormField>

                  <FormField label="Phân loại môn học">
                    {categories.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">Đang tải...</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {categories.map(cat => (
                          <button key={cat.id} type="button"
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-semibold transition-colors ${
                              selectedCategoryId === cat.id
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                          >
                            <span className={selectedCategoryId === cat.id ? 'text-blue-600' : 'text-slate-400'}>
                              <CategoryIcon name={cat.name} />
                            </span>
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Môn học" required>
                      <SelectInput
                        value={selectedSubjectId ? String(selectedSubjectId) : ''}
                        onChange={v => { setSelectedSubjectId(v ? Number(v) : null); setSelectedGradeId(null) }}
                        required
                      >
                        <option value="">Chọn môn...</option>
                        {filteredSubjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </SelectInput>
                    </FormField>
                    <FormField label="Khối lớp">
                      <SelectInput
                        value={selectedGradeId ? String(selectedGradeId) : ''}
                        onChange={v => setSelectedGradeId(v ? Number(v) : null)}
                      >
                        <option value="">Chọn khối...</option>
                        {filteredGrades.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </SelectInput>
                    </FormField>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
                  <SectionHeader icon="list" title="Mô tả chi tiết" />
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Mô tả về kinh nghiệm của bạn, phương pháp giảng dạy và mục tiêu đầu ra của lớp học..."
                    className="input-base resize-none" />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
                  <SectionHeader icon="clock" title="Lịch học dự kiến" />

                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day, idx) => {
                      const dow = DAY_OF_WEEK[idx]
                      const active = selectedDays.includes(dow)
                      return (
                        <button key={dow} type="button" onClick={() => toggleDay(dow)}
                          className={`py-2 rounded-lg text-sm font-semibold border transition-colors text-center ${
                            active
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex justify-center items-end gap-3">
                    <FormField label="Giờ bắt đầu">
                      <TimePicker hour={startHour} min={startMin} period={startPeriod}
                        onHour={setStartHour} onMin={setStartMin} onPeriod={setStartPeriod} />
                    </FormField>
                    <span className="pb-2.5 text-slate-400 font-bold text-base shrink-0">—</span>
                    <FormField label="Giờ kết thúc">
                      <TimePicker hour={endHour} min={endMin} period={endPeriod}
                        onHour={setEndHour} onMin={setEndMin} onPeriod={setEndPeriod} />
                    </FormField>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Lưu ý: Khung giờ này sẽ được áp dụng cho tất cả các ngày bạn đã chọn ở trên.
                  </p>
                </div>
              </div>

              <div className="w-96 shrink-0 sticky top-24">
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-5">
                  <SectionHeader icon="card" title="Hình thức & Học phí" />

                  <FormField label="Hình thức dạy">
                    <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                      {(['ONLINE', 'OFFLINE'] as TeachMode[]).map(m => (
                        <button key={m} type="button" onClick={() => setMode(m)}
                          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                            mode === m ? 'bg-blue-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {m === 'ONLINE' ? 'Online' : 'Offline'}
                        </button>
                      ))}
                    </div>
                  </FormField>

                  <FormField label="Học phí dự kiến (VNĐ/Khóa)" required>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={fee}
                        onChange={e => {
                          const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '')
                          if (raw === '') { setFee(''); return }
                          setFee(Number(raw).toLocaleString('de-DE'))
                        }}
                        required
                        placeholder="200.000"
                        className="input-base pr-6"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">đ</span>
                    </div>
                  </FormField>

                  <FormField label="Số lượng học viên tối đa" required>
                    <input type="number" min={1} max={50} value={maxStudents}
                      onChange={e => setMaxStudents(e.target.value)}
                      placeholder="Ví dụ: 5" required className="input-base" />
                  </FormField>

                  <FormField label="Tổng số buổi học">
                    <input type="number" min={1} value={totalSessions}
                      onChange={e => setTotalSessions(e.target.value)}
                      placeholder="Ví dụ: 24" className="input-base" />
                  </FormField>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Học phí gợi ý: 150k–400k/buổi dựa trên thị trường hiện tại.
                    </p>
                  </div>

                  <button type="submit" disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-bold transition-colors shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Đang đăng...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Đăng lớp học ngay
                      </>
                    )}
                  </button>

                  <button type="button" onClick={() => window.location.href = '/tutor/classes'}
                    className="w-full py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    Hủy bỏ
                  </button>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>
    </AccountLayout>
  )
}

function FormField({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SelectInput({ value, onChange, required, children }: {
  value: string; onChange: (v: string) => void; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        className="input-base appearance-none pr-8">
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  )
}

function CategoryIcon({ name }: { name: string }) {
  const n = name.toLowerCase()
  if (n.includes('ngoại ngữ') || n.includes('ngoai ngu') || n.includes('language')) {
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    )
  }
  if (n.includes('năng khiếu') || n.includes('nang khieu') || n.includes('talent')) {
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  }
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function SectionHeader({ icon, title }: { icon: 'doc' | 'list' | 'clock' | 'card'; title: string }) {
  const icons = {
    doc:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />,
    clock:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    card: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icons[icon]}
        </svg>
      </div>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
    </div>
  )
}
