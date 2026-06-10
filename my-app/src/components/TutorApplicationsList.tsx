import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getMyApplications, type ApplicationResponse } from '../api/applications'
import { getMediaUrl } from '../api/axios'

export function TutorApplicationsList() {
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filteredStatus, setFilteredStatus] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const data = await getMyApplications()
      setApplications(data)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Không thể tải danh sách ứng tuyển')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (filteredStatus === 'ALL') return true
    return app.status === filteredStatus
  })

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
    accepted: applications.filter((a) => a.status === 'ACCEPTED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-flex items-center gap-2">
          <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600">Đang tải ứng tuyển...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            filteredStatus === 'ALL'
              ? 'bg-blue-50 border-blue-300'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
          onClick={() => setFilteredStatus('ALL')}
        >
          <p className="text-sm text-slate-600 mb-1">Tất cả</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div
          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            filteredStatus === 'PENDING'
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-white border-slate-200 hover:border-yellow-200'
          }`}
          onClick={() => setFilteredStatus('PENDING')}
        >
          <p className="text-sm text-slate-600 mb-1">Chờ xét duyệt</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div
          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            filteredStatus === 'ACCEPTED'
              ? 'bg-green-50 border-green-300'
              : 'bg-white border-slate-200 hover:border-green-200'
          }`}
          onClick={() => setFilteredStatus('ACCEPTED')}
        >
          <p className="text-sm text-slate-600 mb-1">Đã được chọn</p>
          <p className="text-2xl font-bold text-green-700">{stats.accepted}</p>
        </div>
        <div
          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            filteredStatus === 'REJECTED'
              ? 'bg-red-50 border-red-300'
              : 'bg-white border-slate-200 hover:border-red-200'
          }`}
          onClick={() => setFilteredStatus('REJECTED')}
        >
          <p className="text-sm text-slate-600 mb-1">Bị từ chối</p>
          <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <i className="fa-regular fa-file-lines text-5xl text-slate-300 mb-4 block"></i>
          <p className="text-slate-500 text-lg font-medium mb-2">
            {filteredStatus === 'ALL' ? 'Chưa có ứng tuyển nào' : 'Không có ứng tuyển ở trạng thái này'}
          </p>
          <p className="text-slate-400 text-sm">
            {filteredStatus === 'ALL'
              ? 'Hãy xem bảng tin và ứng tuyển để bắt đầu'
              : 'Thử bộ lọc khác'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
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
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Học viên yêu cầu</p>
                      <h3 className="font-bold text-slate-900 text-lg">{app.tutorName}</h3>
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
                        {app.status === 'PENDING' ? 'Chờ xét duyệt' : app.status === 'ACCEPTED' ? 'Đã chọn' : 'Bị từ chối'}
                      </span>
                    </div>
                  </div>

                  {/* Introduction */}
                  <div className="bg-slate-50 rounded p-4 mb-3 border border-slate-100">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{app.introduction}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Ứng tuyển ngày {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    {app.status === 'ACCEPTED' && (
                      <div className="flex items-center gap-2 text-green-700 font-semibold">
                        <i className="fa-solid fa-check-circle"></i>
                        Bạn được chọn cho vị trí này
                      </div>
                    )}
                    {app.status === 'REJECTED' && (
                      <div className="flex items-center gap-2 text-red-700 font-semibold">
                        <i className="fa-solid fa-circle-xmark"></i>
                        Ứng tuyển bị từ chối
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
