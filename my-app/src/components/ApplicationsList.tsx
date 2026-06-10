import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  getReceivedApplications,
  acceptApplication,
  rejectApplication,
  type ApplicationResponse
} from '../api/applications'
import { getMediaUrl } from '../api/axios'

interface ApplicationsListProps {
  currentUserId: number | null
}

export function ApplicationsList({ currentUserId }: ApplicationsListProps) {
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  console.log("ApplicationsList render");
  useEffect(() => {
    void fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const data = await getReceivedApplications()
      console.log('Fetched applicationsssssssssssssssssssssssssssssss:', data)
      setApplications(data)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Không thể tải danh sách ứng tuyển')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async (applicationId: number) => {
    setProcessingId(applicationId)
    try {
      await acceptApplication(applicationId)
      toast.success('Đã chọn gia sư!')
      await fetchApplications()
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
      await fetchApplications()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Không thể từ chối ứng tuyển'
      toast.error(errorMessage)
      console.error('Error rejecting application:', error)
    } finally {
      setProcessingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="inline-flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600">Đang tải ứng tuyển...</span>
        </div>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fa-regular fa-file-lines text-5xl text-slate-300 mb-4 block"></i>
        <p className="text-slate-500 text-lg">Chưa có ứng tuyển nào</p>
        <p className="text-slate-400 text-sm">Gia sư sẽ bắt đầu ứng tuyển cho bảng tin này</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="shrink-0">
              <img
                src={app.tutorAvatar ? getMediaUrl(app.tutorAvatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(app.tutorName)}&background=random`}
                alt={app.tutorName}
                className="w-16 h-16 rounded-full object-cover border border-slate-200"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{app.tutorName}</h3>
                  <p className="text-sm text-slate-500">
                    Ứng tuyển {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      app.status === 'PENDING'
                        ? 'bg-yellow-50 text-yellow-700'
                        : app.status === 'ACCEPTED'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {app.status === 'PENDING' ? 'Chờ xét duyệt' : app.status === 'ACCEPTED' ? 'Đã chọn' : 'Đã từ chối'}
                  </span>
                </div>
              </div>

              {/* Introduction */}
              <div className="bg-slate-50 rounded p-4 mb-4 border border-slate-100">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{app.introduction}</p>
              </div>

              {/* Actions */}
              {app.status === 'PENDING' && currentUserId && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(app.id)}
                    disabled={processingId !== null}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingId === app.id && (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    )}
                    Chọn gia sư
                  </button>
                  <button
                    onClick={() => handleReject(app.id)}
                    disabled={processingId !== null}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingId === app.id && (
                      <span className="inline-block w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></span>
                    )}
                    Từ chối
                  </button>
                </div>
              )}

              {app.status !== 'PENDING' && (
                <div className="text-sm text-slate-500">
                  {app.status === 'ACCEPTED' ? 'Bạn đã chọn gia sư này' : 'Bạn đã từ chối ứng tuyển này'}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
