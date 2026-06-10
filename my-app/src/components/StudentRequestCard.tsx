import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import type { StudentRequestsWithApplications } from '../api/studentRequests'
import { getReceivedApplications, acceptApplication, rejectApplication, type ApplicationResponse } from '../api/applications'
import { getMediaUrl } from '../api/axios'

interface StudentRequestCardProps {
  request: StudentRequestsWithApplications
  onApplicationUpdated?: () => void
  defaultExpandedApplications?: boolean
}

export function StudentRequestCard({ request, onApplicationUpdated, defaultExpandedApplications = false }: StudentRequestCardProps) {
  const [expandedApplications, setExpandedApplications] = useState(defaultExpandedApplications)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [applications, setApplications] = useState<ApplicationResponse[]>(request.applications ?? [])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)

  const fetchApplicationsForRequest = useCallback(async () => {
    setIsLoadingApplications(true)
    try {
      const allApplications = await getReceivedApplications()
      // API trả về tất cả applications của học viên, filter theo id của request hiện tại
      const filtered = allApplications.filter(
        (app) => app.studentRequestId === request.id
      )
      console.log('[StudentRequestCard] API returned all applications:', allApplications)
      console.log('[StudentRequestCard] filtered for request', request.id, ':', filtered)
      setApplications(filtered)
    } catch (error) {
      console.error('Error fetching applications:', error)
      setApplications([])
    } finally {
      setIsLoadingApplications(false)
    }
  }, [request.id])

  const handleAccept = async (applicationId: number) => {
    setProcessingId(applicationId)
    try {
      await acceptApplication(applicationId)
      toast.success('Đã chọn gia sư!')
      onApplicationUpdated?.()
      void fetchApplicationsForRequest()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Không thể chấp nhận ứng tuyển'
      toast.error(errorMessage)
      console.error('Error accepting application:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (applicationId: number) => {
    setProcessingId(applicationId)
    try {
      await rejectApplication(applicationId)
      toast.success('Đã từ chối ứng tuyển')
      onApplicationUpdated?.()
      void fetchApplicationsForRequest()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Không thể từ chối ứng tuyển'
      toast.error(errorMessage)
      console.error('Error rejecting application:', error)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Tìm gia sư {request.subjectTags}
            </h3>
            <p className="text-sm text-slate-600 mt-1">Mã bảng tin: LH{request.id}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 ${
              request.status === 'MATCHED'
                ? 'bg-green-100 text-green-700'
                : request.status === 'ACTIVE'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700'
            }`}
          >
            {request.status === 'MATCHED' ? 'Đã match' : 'Đang tìm'}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-slate-600 mb-0.5">Cấp học</p>
            <p className="font-semibold text-slate-900">{request.gradeLevel}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-0.5">Buổi/tuần</p>
            <p className="font-semibold text-slate-900">{request.sessionsPerWeek}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-0.5">Hình thức</p>
            <p className="font-semibold text-slate-900">
              {request.teachingMode === 'ONLINE' ? 'Online' : 'Offline'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-0.5">Học phí</p>
            <p className="font-semibold text-slate-900">{request.budget.toLocaleString('vi-VN')} đ</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Contact Info */}
        <div className="mb-5 pb-5 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-600 mb-1">Liên hệ</p>
              <p className="font-semibold text-slate-900">{request.contactName}</p>
            </div>
            <div>
              <p className="text-slate-600 mb-1">Số điện thoại</p>
              <p className="font-semibold text-slate-900">{request.phone}</p>
            </div>
            <div>
              <p className="text-slate-600 mb-1">Địa chỉ</p>
              <p className="font-semibold text-slate-900">{request.address}</p>
            </div>
          </div>
        </div>

        {/* Applications Stats */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-900">Ứng tuyển</h4>
            <button
    onClick={() => {
                setExpandedApplications(!expandedApplications)
                // Chỉ fetch nếu applications chưa có và chưa từng fetch trước đó
                if (!expandedApplications && applications.length === 0 && !isLoadingApplications) {
                  void fetchApplicationsForRequest()
                }
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center gap-1"
            >
              <i
                className={`fa-solid fa-chevron-${expandedApplications ? 'up' : 'down'}`}
              ></i>
              {expandedApplications ? 'Ẩn' : 'Xem'}
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-slate-50 rounded p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
              <p className="text-xs text-slate-600">Tất cả</p>
            </div>
            <div className="bg-yellow-50 rounded p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">{applications.filter((a) => a.status === 'PENDING').length}</p>
              <p className="text-xs text-slate-600">Chờ xét</p>
            </div>
            <div className="bg-green-50 rounded p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{applications.filter((a) => a.status === 'ACCEPTED').length}</p>
              <p className="text-xs text-slate-600">Đã chọn</p>
            </div>
            <div className="bg-red-50 rounded p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{applications.filter((a) => a.status === 'REJECTED').length}</p>
              <p className="text-xs text-slate-600">Từ chối</p>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {expandedApplications && (
          <div className="space-y-3 border-t border-slate-100 pt-5">
            {isLoadingApplications ? (
              <div className="flex justify-center items-center py-6">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-slate-500 text-sm">Đang tải ứng tuyển...</span>
                </div>
              </div>
            ) : applications.length === 0 ? (
              <p className="text-center py-6 text-slate-500">
                <i className="fa-regular fa-file-lines text-3xl text-slate-300 block mb-2"></i>
                Chưa có ứng tuyển nào
              </p>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="flex gap-3 mb-3">
                    {/* Avatar */}
                    <img
                      src={
                        app.tutorAvatar
                          ? getMediaUrl(app.tutorAvatar) ?? ''
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(app.tutorName)}&background=random`
                      }
                      alt={app.tutorName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-slate-900">{app.tutorName}</h5>
                          <p className="text-xs text-slate-500">
                            {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                            app.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : app.status === 'ACCEPTED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {app.status === 'PENDING'
                            ? 'Chờ xét'
                            : app.status === 'ACCEPTED'
                              ? 'Đã chọn'
                              : 'Từ chối'}
                        </span>
                      </div>

                      {/* Introduction */}
                      <p className="text-sm text-slate-700 mt-2 line-clamp-2">{app.introduction}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {app.status === 'PENDING' && (
                    <div className="flex gap-2 pt-3 border-t border-slate-200">
                      <button
                        onClick={() => handleAccept(app.id)}
                        disabled={processingId !== null}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingId === app.id && (
                          <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                        )}
                        Chọn
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        disabled={processingId !== null}
                        className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-3 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingId === app.id && (
                          <span className="inline-block w-3 h-3 border-2 border-slate-700 border-t-transparent rounded-full animate-spin mr-1"></span>
                        )}
                        Từ chối
                      </button>
                    </div>
                  )}

                  {app.status !== 'PENDING' && (
                    <p className="text-xs text-slate-500 pt-3 border-t border-slate-200">
                      {app.status === 'ACCEPTED' ? '✓ Bạn đã chọn gia sư này' : '✗ Bạn đã từ chối'}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-sm">
        <p className="text-slate-600">Đăng ngày {new Date(request.createdAt).toLocaleDateString('vi-VN')}</p>
        <a
          href={`/discover/student-requests/${request.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Xem chi tiết →
        </a>
      </div>
    </div>
  )
}