import { useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import { AccountLayout } from '../../components/AccountLayout'

const EXPERIENCE_OPTIONS = [
  'Dưới 1 năm',
  '1 - 2 năm',
  '2 - 3 năm',
  '3 - 5 năm',
  'Trên 5 năm',
]

const DEFAULT_SUBJECTS = [
  'Toán học', 'Vật lý', 'Tiếng Anh', 'Hóa học',
  'Ngữ văn', 'Sinh học', 'Lịch sử', 'Địa lý',
]

interface UploadedFile {
  name: string
  size: number
}

export function TutorInfo() {
  const [fullName, setFullName] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [occupation, setOccupation] = useState('')
  const [studentUniversity, setStudentUniversity] = useState('')
  const [studentYear, setStudentYear] = useState('')
  const [studentMajor, setStudentMajor] = useState('')
  const [graduatedUniversity, setGraduatedUniversity] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [workerMajor, setWorkerMajor] = useState('')

  const [experience, setExperience] = useState('')
  const [university, setUniversity] = useState('')
  const [major, setMajor] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Toán học', 'Tiếng Anh'])
  const [allSubjects, setAllSubjects] = useState<string[]>(DEFAULT_SUBJECTS)
  const [newSubject, setNewSubject] = useState('')
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isStudent = occupation === 'student'
  const isWorker = ['teacher', 'lecturer', 'worker'].includes(occupation)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    )
  }

  const addCustomSubject = () => {
    const trimmed = newSubject.trim()
    if (!trimmed || allSubjects.includes(trimmed)) return
    setAllSubjects((prev) => [...prev, trimmed])
    setSelectedSubjects((prev) => [...prev, trimmed])
    setNewSubject('')
    setShowAddSubject(false)
  }

  const processFiles = (files: FileList | null) => {
    if (!files) return
    const newFiles: UploadedFile[] = Array.from(files).map((f) => ({ name: f.name, size: f.size }))
    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeFile = (index: number) => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))

    const tutorData = {
      fullName, gender, phone, birthYear, occupation,
      studentUniversity, studentYear, studentMajor,
      graduatedUniversity, graduationYear, workerMajor,
      experience, university, major,
      subjects: selectedSubjects,
      avatarPreview,
      bio,
    }
    localStorage.setItem('tutor_profile', JSON.stringify(tutorData))

    setIsSubmitting(false)
    window.location.href = '/tutor/profile'
  }

  return (
    <AccountLayout activePath="/tutor/profile">
      <div className="min-h-screen bg-slate-100 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-sm">
          <form onSubmit={handleSubmit} className="px-6 py-8 flex flex-col gap-6">

            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">Thông tin Gia sư</h1>
              <p className="text-sm text-slate-500 mt-1">
                Vui lòng cung cấp chi tiết về chuyên môn để học viên có thể hiểu rõ hơn về bạn.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2">
                Thông tin cá nhân
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                      className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Năm sinh <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      required
                      className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn năm sinh</option>
                      {Array.from({ length: 40 }, (_, i) => 2007 - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2">
                Thông tin chuyên môn
              </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Nghề nghiệp <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  required
                  className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn nghề nghiệp</option>
                  <option value="student">Sinh viên</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="lecturer">Giảng viên</option>
                  <option value="worker">Người đi làm</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {isStudent && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Trường đang học <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Đại học Bách Khoa"
                      value={studentUniversity}
                      onChange={(e) => setStudentUniversity(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Sinh viên năm <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={studentYear}
                        onChange={(e) => setStudentYear(e.target.value)}
                        className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Chọn năm</option>
                        {['Năm 1', 'Năm 2', 'Năm 3', 'Năm 4', 'Năm 5', 'Năm 6'].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Chuyên ngành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Công nghệ thông tin"
                    value={studentMajor}
                    onChange={(e) => setStudentMajor(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {isWorker && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Trường tốt nghiệp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Đại học Sư Phạm"
                      value={graduatedUniversity}
                      onChange={(e) => setGraduatedUniversity(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Năm tốt nghiệp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Chọn năm</option>
                        {Array.from({ length: 30 }, (_, i) => 2025 - i).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Chuyên ngành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Sư phạm Toán"
                    value={workerMajor}
                    onChange={(e) => setWorkerMajor(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Kinh nghiệm giảng dạy</label>
              <div className="relative">
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Chọn số năm kinh nghiệm</option>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Môn dạy <span className="text-slate-400 font-normal">(Có thể chọn nhiều)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {allSubjects.map((subject) => {
                  const active = selectedSubjects.includes(subject)
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {subject}
                      {active && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
                {showAddSubject ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addCustomSubject() }
                        if (e.key === 'Escape') setShowAddSubject(false)
                      }}
                      placeholder="Tên môn..."
                      className="border border-blue-400 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-28"
                    />
                    <button type="button" onClick={addCustomSubject} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">OK</button>
                    <button type="button" onClick={() => setShowAddSubject(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddSubject(true)}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-medium border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm môn
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Ảnh bản thân</label>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 overflow-hidden"
                  style={{ minHeight: '160px' }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Ảnh bản thân" className="w-full h-full object-cover" style={{ minHeight: '160px' }} />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 text-center px-2">Nhấn để chọn ảnh</p>
                      <p className="text-xs text-slate-400 text-center px-2">JPG, PNG (Tối đa 5MB)</p>
                    </>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Tải lên chứng chỉ</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                  style={{ minHeight: '160px' }}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 text-center px-2">Nhấn để tải lên hoặc kéo thả</p>
                  <p className="text-xs text-slate-400 text-center px-2">PDF, JPG, PNG (Tối đa 5MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => processFiles(e.target.files)}
                />
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                          </svg>
                          <span className="text-xs text-slate-700 truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
                          <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Giới thiệu bản thân</label>
                <span className="text-xs text-slate-400">{bio.length}/500</span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="Chia sẻ về phương pháp giảng dạy, phong cách làm việc và những thành tích nổi bật của bạn..."
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-700 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                {isSubmitting ? 'Đang lưu...' : 'Hoàn tất'}
                {!isSubmitting && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AccountLayout>
  )
}
