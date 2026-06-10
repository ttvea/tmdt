import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getMyStudentRequests, type StudentRequestsWithApplications } from '../../api/studentRequests'
import { StudentRequestCard } from '../../components/StudentRequestCard'
import { AccountLayout } from '../../components/AccountLayout'

type FilterStatus = 'ALL' | 'ACTIVE' | 'MATCHED'

export function MyStudentRequests() {
  const [requests, setRequests] = useState<StudentRequestsWithApplications[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    fetchMyRequests()
  }, [])

  const fetchMyRequests = async () => {
    setIsLoading(true)
    try {
      console.log('[MyStudentRequests] fetching my requests...')
      const data = await getMyStudentRequests()
      console.log('[MyStudentRequests] fetched requests:', data)
      setRequests(data)
      if (data.length === 0) {
        toast.info('Bạn chưa đăng bảng tin nào')
      }
    } catch (error) {
      console.error('[MyStudentRequests] Error fetching requests:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } }
        console.error('[MyStudentRequests] status:', axiosError.response?.status)
        console.error('[MyStudentRequests] response data:', axiosError.response?.data)
      }
      toast.error('Không thể tải danh sách bảng tin')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    if (filterStatus === 'ALL') return true
    if (filterStatus === 'ACTIVE') return req.status !== 'MATCHED'
    if (filterStatus === 'MATCHED') return req.status === 'MATCHED'
    return true
  })

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB
  })

  // Calculate statistics
  const stats = {
    total: requests.length,
    active: requests.filter((r) => r.status !== 'MATCHED').length,
    matched: requests.filter((r) => r.status === 'MATCHED').length,
    totalApplications: requests.reduce((sum, r) => sum + r.totalApplications, 0),
    pendingApplications: requests.reduce((sum, r) => sum + r.pendingApplications, 0),
  }

  return (
    <AccountLayout activePath="/student/my-requests">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Bảng tin của tôi</h1>
          <p className="text-slate-600">Quản lý tất cả bảng tin tìm gia sư của bạn</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-slate-600 text-sm mb-1">Tất cả bảng tin</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 shadow-sm">
            <p className="text-blue-700 text-sm mb-1">Đang tìm</p>
            <p className="text-3xl font-bold text-blue-900">{stats.active}</p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 shadow-sm">
            <p className="text-green-700 text-sm mb-1">Đã match</p>
            <p className="text-3xl font-bold text-green-900">{stats.matched}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 shadow-sm">
            <p className="text-yellow-700 text-sm mb-1">Tổng ứng tuyển</p>
            <p className="text-3xl font-bold text-yellow-900">{stats.totalApplications}</p>
          </div>
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 shadow-sm">
            <p className="text-orange-700 text-sm mb-1">Chờ xét duyệt</p>
            <p className="text-3xl font-bold text-orange-900">{stats.pendingApplications}</p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Lọc:</span>

              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả ({stats.total})
              </button>

              <button
                onClick={() => setFilterStatus('ACTIVE')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'ACTIVE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Đang tìm ({stats.active})
              </button>

              <button
                onClick={() => setFilterStatus('MATCHED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'MATCHED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Đã match ({stats.matched})
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Sắp xếp:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 outline-none focus:border-blue-500 bg-white"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchMyRequests}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-rotate-right"></i>
              Làm mới
            </button>
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-600 font-medium">Đang tải...</span>
              </div>
            </div>
          </div>
        ) : sortedRequests.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 shadow-sm text-center">
            <i className="fa-regular fa-file-lines text-6xl text-slate-300 mb-4 block"></i>
            <p className="text-slate-600 text-lg font-medium mb-2">Không có bảng tin</p>
            <p className="text-slate-500 mb-6">
              {filterStatus === 'ALL'
                ? 'Bạn chưa đăng bảng tin tìm gia sư nào'
                : filterStatus === 'ACTIVE'
                  ? 'Không có bảng tin nào đang tìm'
                  : 'Không có bảng tin nào đã match'}
            </p>
            <a
              href="/post-class"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Đăng bảng tin mới
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedRequests.map((request) => (
              <StudentRequestCard
                key={request.id}
                request={request}
                onApplicationUpdated={fetchMyRequests}
                defaultExpandedApplications
              />
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
