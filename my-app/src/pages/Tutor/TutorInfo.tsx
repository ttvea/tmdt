import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from 'react'
import { toast } from 'react-toastify'
import { AccountLayout } from '../../components/AccountLayout'
import {
  getTutorProfileForEdit,
  getTutorProfile,
  saveTutorProfile,
  getAllSubjects,
  uploadAvatar as uploadAvatarApi,
  uploadCertificate as uploadCertificateApi,
  type SubjectOption,
} from '../../api/tutorProfile'
import { getMediaUrl } from '../../api/axios'

const EXPERIENCE_OPTIONS = [
  'Dưới 1 năm',
  '1 - 2 năm',
  '2 - 3 năm',
  '3 - 5 năm',
  'Trên 5 năm',
]

interface UploadedFile {
  name: string
  size: number
}

export function TutorInfo() {
  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const userId: number = user?.id

  const [fullName, setFullName] = useState(user?.fullName ?? user?.username ?? user?.name ?? '')
  const [gender, setGender] = useState(user?.gender ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [birthYear, setBirthYear] = useState(user?.birthday ? String(user.birthday) : '')
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
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([])
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(getMediaUrl(user?.avatar))
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [certificateFiles, setCertificateFiles] = useState<File[]>([])
  const [bio, setBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [showPendingReviewModal, setShowPendingReviewModal] = useState(false)

  useEffect(() => {
    // Load tất cả môn học từ backend
    getAllSubjects()
      .then(setAllSubjects)
      .catch(() => {})

    if (!userId) return
    getTutorProfileForEdit(userId)
      .then((data) => {
        if (data.fullName) setFullName(data.fullName)
        if (data.phone) setPhone(data.phone)
        if (data.birthday) setBirthYear(String(data.birthday))
        if (data.gender) setGender(data.gender)
        if (data.occupationType) setOccupation(data.occupationType)
        if (data.university) setUniversity(data.university)
        if (data.major) setMajor(data.major)
        if (data.bio) setBio(data.bio)
        if (data.experience) setExperience(data.experience)
        if (data.subjectIds?.length) setSelectedSubjectIds(data.subjectIds)

        if (data.occupationType === 'student') {
          if (data.university) setStudentUniversity(data.university)
          if (data.studentYear) setStudentYear(`Năm ${data.studentYear}`)
          if (data.major) setStudentMajor(data.major)
        }

        if (data.occupationType === 'teacher' || data.occupationType === 'worker' || data.occupationType === 'lecturer') {
          if (data.graduatedSchool) setGraduatedUniversity(data.graduatedSchool)
          if (data.graduatedYear) setGraduationYear(String(data.graduatedYear))
          if (data.teachMajor) setWorkerMajor(data.teachMajor)
          if (data.schoolName) setStudentUniversity(data.schoolName)
        }
      })
      .catch(() => {
        setLoadError('Không thể tải dữ liệu cũ. Bạn có thể điền mới.')
      })

    getTutorProfile(userId).then((profile) => {
      if (profile.avatar) setAvatarPreview(getMediaUrl(profile.avatar))
    }).catch(() => {})
  }, [userId])

  const isStudent = occupation === 'student'
  const isWorker = ['teacher', 'lecturer', 'worker'].includes(occupation)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const toggleSubject = (id: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const processFiles = (files: FileList | null) => {
    if (!files) return
    const newFiles: UploadedFile[] = Array.from(files).map((f) => ({ name: f.name, size: f.size }))
    setUploadedFiles((prev) => [...prev, ...newFiles])
    setCertificateFiles((prev) => [...prev, ...Array.from(files)])
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    setCertificateFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast.error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
      return
    }
    setIsSubmitting(true)

    try {
      const studentYearNum = studentYear ? parseInt(studentYear.replace('Năm ', '')) : null

      const request = {
        fullName,
        phone,
        birthday: birthYear ? parseInt(birthYear) : null,
        gender,
        occupationType: occupation,
        university: occupation === 'student' ? studentUniversity : university,
        studentYear: occupation === 'student' ? studentYearNum : null,
        major: occupation === 'student' ? studentMajor : major,
        schoolName: occupation === 'teacher' ? studentUniversity : '',
        teachMajor: ['teacher', 'lecturer', 'worker'].includes(occupation) ? workerMajor : '',
        graduatedSchool: ['teacher', 'lecturer', 'worker'].includes(occupation) ? graduatedUniversity : '',
        graduatedYear: ['teacher', 'lecturer', 'worker'].includes(occupation) && graduationYear
          ? parseInt(graduationYear) : null,
        experience,
        subjectIds: selectedSubjectIds,
        bio,
      }

      await saveTutorProfile(userId, request)

      if (userRaw) {
        const updatedUser = { ...user, fullName, phone, birthday: request.birthday, gender }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      if (avatarFile) {
        await uploadAvatarApi(userId, avatarFile)
      }

      for (const certFile of certificateFiles) {
        await uploadCertificateApi(userId, certFile)
      }

      setShowPendingReviewModal(true)
    } catch {
      toast.error('Lưu thông tin thất bại. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
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

            {loadError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                {loadError}
              </div>
            )}

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
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
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
                  <label className="text-m font-semibold text-slate-700">
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
                  <label className="text-m font-semibold text-slate-700">
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
              <h2 className="text-m font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-2">
                Thông tin chuyên môn
              </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-m font-semibold text-slate-700">
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
                    <label className="text-m font-semibold text-slate-700">
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
                    <label className="text-m font-semibold text-slate-700">
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
                  <label className="text-m font-semibold text-slate-700">
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
                    <label className="text-m font-semibold text-slate-700">
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
                    <label className="text-m font-semibold text-slate-700">
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
                  <label className="text-m font-semibold text-slate-700">
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
                  <option value="" disabled>
                    Chọn mức kinh nghiệm
                  </option>
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

            <div className="flex flex-col gap-2">
              <label className="text-m font-semibold text-slate-700">
                Môn dạy <span className="text-slate-400 font-normal">(Có thể chọn nhiều)</span>
              </label>
              {allSubjects.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Đang tải danh sách môn học...</p>
              ) : (
                (() => {

                  const grouped: Record<string, SubjectOption[]> = {}
                  allSubjects.forEach((s) => {
                    const cat = s.category?.name ?? 'Khác'
                    if (!grouped[cat]) grouped[cat] = []
                    grouped[cat].push(s)
                  })
                  return (
                    <div className="flex flex-col gap-4">
                      {Object.entries(grouped).map(([catName, subjects]) => (
                        <div key={catName} className="flex flex-col gap-2">
                          <p className="text-sm font-bold text-slate-700">{catName}</p>
                          <div className="flex flex-wrap gap-2">
                            {subjects.map((subject) => {
                              const active = selectedSubjectIds.includes(subject.id)
                              return (
                                <button
                                  key={subject.id}
                                  type="button"
                                  onClick={() => toggleSubject(subject.id)}
                                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                    active
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
                                  }`}
                                >
                                  {subject.name}
                                  {active && (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-m font-semibold text-slate-700">Ảnh bản thân</label>
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
                <label className="text-m font-semibold text-slate-700">Tải lên chứng chỉ</label>
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
                <label className="text-m font-semibold text-slate-700">Giới thiệu bản thân</label>
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

      {showPendingReviewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-950">Hồ sơ đã được tải lên</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hồ sơ gia sư của bạn đã được ghi nhận và đang chờ admin duyệt. Sau khi được xác thực, bạn mới có thể mở lớp và nhận học viên.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowPendingReviewModal(false)
                window.location.href = '/tutor/profile'
              }}
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
            >
              Xem hồ sơ
            </button>
          </section>
        </div>
      ) : null}
    </AccountLayout>
  )
}
