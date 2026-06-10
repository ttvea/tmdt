import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../layouts/Navbar'
import Footer from '../../layouts/Footer'
import { toast } from 'react-toastify'
import { ApplicationsList } from '../../components/ApplicationsList'
import { isTutorRole } from '../../utils/userRole'
import api from '../../api/axios'

interface StudentRequest {
  id: number
  contactName: string
  phone: string
  address: string
  subjectTags: string
  gradeLevel: string
  studyTimeTags: string
  teachingMode: 'ONLINE' | 'OFFLINE'
  sessionsPerWeek: number
  budget: number
  requirements: string
  createdAt: string
  userId: number
}

export function StudentRequestDetail() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const [request, setRequest] = useState<StudentRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userRaw = localStorage.getItem('user')
  const user = userRaw ? JSON.parse(userRaw) : null
  const isTutor = user ? isTutorRole(user.role) : false
  const isOwner = user && request ? user.id === request.userId : false

  useEffect(() => {
    fetchRequest()
  }, [requestId])

  const fetchRequest = async () => {
    if (!requestId || isNaN(Number(requestId))) {
      setError('ID bảng tin không hợp lệ')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Gọi API lấy chi tiết bảng tin của học viên
      const response = await api.get(`/api/student-requests/${requestId}`, {
        headers,
      })

      const data = response.data?.data ?? response.data
      setRequest(data)
    } catch (err) {
      console.error('Error fetching request:', err)
      setError('Không thể tải bảng tin')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-600 font-medium">Đang tải...</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <i className="fa-regular fa-circle-xmark text-6xl text-red-500 mb-4 block"></i>
            <p className="text-slate-700 font-semibold mb-2">{error || 'Không tìm thấy bảng tin'}</p>
            <button
              onClick={() => navigate('/discover/student-requests')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto py-8 px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/discover/student-requests')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
        >
          <i className="fa-solid fa-chevron-left"></i>
          Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Request Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
                <h1 className="text-3xl font-bold mb-2">Tìm gia sư {request.subjectTags}</h1>
                <p className="text-blue-100">Mã lớp: LH{request.id}</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-semibold">
                    {request.gradeLevel}
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                    {request.sessionsPerWeek} buổi/tuần
                  </span>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      request.teachingMode === 'ONLINE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {request.teachingMode === 'ONLINE' ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Contact Information */}
                <div className="border-t border-slate-200 pt-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Thông tin liên hệ</h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <i className="fa-solid fa-user text-blue-600 mt-1"></i>
                      <div>
                        <p className="text-sm text-slate-600">Tên liên hệ</p>
                        <p className="font-semibold text-slate-900">{request.contactName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <i className="fa-solid fa-phone text-blue-600 mt-1"></i>
                      <div>
                        <p className="text-sm text-slate-600">Số điện thoại</p>
                        <p className="font-semibold text-slate-900">{request.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <i className="fa-solid fa-location-dot text-blue-600 mt-1"></i>
                      <div>
                        <p className="text-sm text-slate-600">Địa chỉ</p>
                        <p className="font-semibold text-slate-900">{request.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Class Details */}
                <div className="border-t border-slate-200 pt-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Chi tiết lớp học</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Môn học</p>
                      <p className="font-semibold text-slate-900">{request.subjectTags}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Lớp</p>
                      <p className="font-semibold text-slate-900">{request.gradeLevel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Thời gian học</p>
                      <p className="font-semibold text-slate-900">{request.studyTimeTags}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Học phí dự kiến</p>
                      <p className="font-semibold text-slate-900">{request.budget.toLocaleString('vi-VN')} đ/tháng</p>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                {request.requirements && (
                  <div className="border-t border-slate-200 pt-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Yêu cầu khác</h2>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <p className="text-slate-700 whitespace-pre-wrap">{request.requirements}</p>
                    </div>
                  </div>
                )}

                {/* Posted Date */}
                <div className="border-t border-slate-200 pt-6 text-sm text-slate-500">
                  Đăng ngày {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Budget & Applications */}
          <div className="space-y-6">
            {/* Budget Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <p className="text-sm text-green-700 mb-1">Học phí dự kiến</p>
              <p className="text-3xl font-bold text-green-900 mb-1">
                {request.budget.toLocaleString('vi-VN')} đ
              </p>
              <p className="text-sm text-green-700">/tháng hoặc /buổi</p>
            </div>

            {/* Action Button */}
            {isTutor && !isOwner && (
              <button
                onClick={() => {
                  if (!user) {
                    toast.error('Vui lòng đăng nhập')
                    return
                  }
                  window.location.href = `/discover/student-requests#apply-${request.id}`
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md"
              >
                <i className="fa-solid fa-paper-plane mr-2"></i>
                Ứng tuyển ngay
              </button>
            )}

            {isOwner && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium mb-3">Đây là bảng tin của bạn</p>
                <button
                  onClick={() => navigate(`/student/requests/${request.id}/applications`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Xem ứng tuyển
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Applications Section (for owner only) */}
        {isOwner && (
          <div className="mt-12">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Danh sách ứng tuyển</h2>
              <ApplicationsList  currentUserId={user?.id || null} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
