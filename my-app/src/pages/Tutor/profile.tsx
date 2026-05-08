import { useState, useRef, type ChangeEvent } from 'react'
import { AccountLayout } from '../../components/AccountLayout'

const SUBJECT_ICONS: Record<string, string> = {
  'Toán học': '📐', 'Vật lý': '⚛️', 'Tiếng Anh': '🌐', 'Hóa học': '🧪',
  'Ngữ văn': '📖', 'Sinh học': '🧬', 'Lịch sử': '🏛️', 'Địa lý': '🗺️',
}

const OCCUPATION_LABELS: Record<string, string> = {
  student: 'Sinh viên',
  teacher: 'Giáo viên',
  lecturer: 'Giảng viên',
  worker: 'Người đi làm',
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Nam', female: 'Nữ', other: 'Khác',
}

const EXPERIENCE_OPTIONS = [
  'Dưới 1 năm', '1 - 2 năm', '2 - 3 năm', '3 - 5 năm', 'Trên 5 năm',
]

interface TutorData {
  fullName: string
  gender: string
  phone: string
  birthYear: string
  occupation: string
  studentUniversity: string
  studentYear: string
  studentMajor: string
  graduatedUniversity: string
  graduationYear: string
  workerMajor: string
  experience: string
  university: string
  major: string
  subjects: string[]
  avatarPreview: string | null
  bio: string
}

function SelectField({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">Chọn...</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
  )
}

export function TutorProfile() {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null

  const email = user?.email ?? ''

  const loadData = (): TutorData => {
    const raw = localStorage.getItem('tutor_profile')
    if (raw) return JSON.parse(raw) as TutorData
    return {
      fullName: user?.username ?? user?.name ?? '',
      gender: '', phone: '', birthYear: '', occupation: '',
      studentUniversity: '', studentYear: '', studentMajor: '',
      graduatedUniversity: '', graduationYear: '', workerMajor: '',
      experience: '', university: '', major: '',
      subjects: [], avatarPreview: null, bio: '',
    }
  }

  const [isEditing, setIsEditing] = useState(false)
  const [data, setData] = useState<TutorData>(loadData)
  const [draft, setDraft] = useState<TutorData>(loadData)
  const [saved, setSaved] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const set = (field: keyof TutorData) => (value: string) =>
    setDraft((prev) => ({ ...prev, [field]: value }))

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setDraft((prev) => ({ ...prev, avatarPreview: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    localStorage.setItem('tutor_profile', JSON.stringify(draft))
    setData(draft)
    setIsEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleCancel = () => {
    setDraft(data)
    setIsEditing(false)
  }

  const isStudent = draft.occupation === 'student'
  const isWorker = ['teacher', 'lecturer', 'worker'].includes(draft.occupation)

  const schoolInfo = data.occupation === 'student'
    ? [data.studentUniversity, data.studentYear].filter(Boolean).join(' · ')
    : [data.graduatedUniversity, data.graduationYear].filter(Boolean).join(' · ')

  const majorInfo = data.occupation === 'student' ? data.studentMajor : data.workerMajor

  return (
    <AccountLayout activePath="/tutor/profile">
      <div className="min-h-screen bg-slate-50 text-left">

        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="max-w-5xl mx-auto flex items-center gap-8">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                {data.avatarPreview ? (
                  <img src={data.avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-14 h-14 text-slate-300 absolute inset-0 m-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
              <span className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            </div>
            <input ref={avatarInputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleAvatarChange} />

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                  {data.fullName || 'Chưa cập nhật tên'}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Đã xác thực
                </span>
              </div>

              <p className="text-blue-600 font-semibold text-base leading-tight">
                {majorInfo || OCCUPATION_LABELS[data.occupation] || 'Gia sư'}
              </p>

              <div className="flex items-center gap-6 text-sm text-slate-500 flex-wrap mt-0.5">
                {data.experience && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M12 3L2 8l10 5 10-5-10-5zM2 16l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    {data.experience} kinh nghiệm
                  </span>
                )}
                {schoolInfo && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {schoolInfo}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => window.location.href = '/tutor/info'}
                className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                Cập nhật thông tin
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-8 flex gap-8 items-start">

          <div className="flex-1 min-w-0 flex flex-col gap-8">

            {saved && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Cập nhật thông tin thành công!
              </div>
            )}

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Giới thiệu bản thân</h2>
              {!isEditing ? (
                <div className="border border-slate-200 rounded-xl p-5 bg-white">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {data.bio || <span className="text-slate-400 italic">Chưa cập nhật giới thiệu bản thân.</span>}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-end">
                    <span className="text-xs text-slate-400">{draft.bio.length}/500</span>
                  </div>
                  <textarea value={draft.bio}
                    onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value.slice(0, 500) }))}
                    rows={6} placeholder="Chia sẻ về phương pháp giảng dạy, phong cách làm việc và những thành tích nổi bật..."
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Kinh nghiệm & Chuyên môn</h2>
              {!isEditing ? (
                <div className="grid grid-cols-2 gap-4">

                  <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Nghề nghiệp</p>
                    <p className="text-sm font-bold text-blue-600">{OCCUPATION_LABELS[data.occupation] || '—'}</p>
                    <p className="text-xs text-slate-500">{schoolInfo || '—'}</p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3L2 8l10 5 10-5-10-5zM2 16l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Kinh nghiệm giảng dạy</p>
                    <p className="text-sm font-bold text-blue-600">{data.experience || '—'}</p>
                    <p className="text-xs text-slate-500">{majorInfo || ''}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 bg-white border border-slate-200 rounded-xl p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Nghề nghiệp" value={draft.occupation} onChange={set('occupation')} required
                      options={[
                        { value: 'student', label: 'Sinh viên' },
                        { value: 'teacher', label: 'Giáo viên' },
                        { value: 'lecturer', label: 'Giảng viên' },
                        { value: 'worker', label: 'Người đi làm' },
                      ]} />
                    <SelectField label="Kinh nghiệm giảng dạy" value={draft.experience} onChange={set('experience')}
                      options={EXPERIENCE_OPTIONS.map(o => ({ value: o, label: o }))} />
                  </div>
                  {isStudent && (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Trường đang học" value={draft.studentUniversity} onChange={set('studentUniversity')} placeholder="Đại học Bách Khoa" />
                        <SelectField label="Sinh viên năm" value={draft.studentYear} onChange={set('studentYear')}
                          options={['Năm 1','Năm 2','Năm 3','Năm 4','Năm 5','Năm 6'].map(y => ({ value: y, label: y }))} />
                      </div>
                      <InputField label="Chuyên ngành" value={draft.studentMajor} onChange={set('studentMajor')} placeholder="Công nghệ thông tin" />
                    </div>
                  )}
                  {isWorker && (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Trường tốt nghiệp" value={draft.graduatedUniversity} onChange={set('graduatedUniversity')} placeholder="Đại học Sư Phạm" />
                        <SelectField label="Năm tốt nghiệp" value={draft.graduationYear} onChange={set('graduationYear')}
                          options={Array.from({ length: 30 }, (_, i) => ({ value: String(2025 - i), label: String(2025 - i) }))} />
                      </div>
                      <InputField label="Chuyên ngành" value={draft.workerMajor} onChange={set('workerMajor')} placeholder="Sư phạm Toán" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Trường (học vấn)" value={draft.university} onChange={set('university')} placeholder="Trường Đại học / Cao đẳng" />
                    <InputField label="Bằng cấp / Chuyên ngành" value={draft.major} onChange={set('major')} placeholder="Chuyên ngành / Bằng cấp" />
                  </div>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Môn học giảng dạy</h2>
              {!isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  {data.subjects.length > 0 ? data.subjects.map((s) => (
                    <div key={s} className="border border-slate-200 rounded-xl p-4 bg-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-base">
                        {SUBJECT_ICONS[s] ?? '📚'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{s}</p>
                        <p className="text-xs text-slate-400">{majorInfo || OCCUPATION_LABELS[data.occupation] || ''}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 italic col-span-2">Chưa cập nhật môn dạy.</p>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {draft.subjects.map((s) => (
                      <button key={s} type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, subjects: prev.subjects.filter(x => x !== s) }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium">
                        {s}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ))}
                    {draft.subjects.length === 0 && <p className="text-sm text-slate-400 italic">Chưa có môn nào.</p>}
                  </div>
                  <p className="text-xs text-slate-400">Nhấn vào môn để bỏ chọn.</p>
                </div>
              )}
            </section>

          </div>

          <div className="w-64 shrink-0 flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-bold text-blue-700">Xác thực</span>
              </div>
              <ul className="flex flex-col gap-2">
                {[
                  'Chứng chỉ giảng dạy',
                  'Kiểm tra lý lịch đã đạt',
                  `Bằng cấp đã được xác minh: ${data.major || 'N/A'}`,
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-700">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Giới tính</span>
                <span className="text-sm font-semibold text-slate-800">{GENDER_LABELS[data.gender] || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Năm sinh</span>
                <span className="text-sm font-semibold text-slate-800">{data.birthYear || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Số điện thoại</span>
                <span className="text-sm font-semibold text-slate-800">{data.phone || '—'}</span>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-400 italic text-center">
                  {data.occupation === 'student'
                    ? `Sinh viên ${data.studentYear || ''} · ${data.studentUniversity || ''}`
                    : `${OCCUPATION_LABELS[data.occupation] || 'Gia sư'} · ${data.graduatedUniversity || ''}`}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AccountLayout>
  )
}


