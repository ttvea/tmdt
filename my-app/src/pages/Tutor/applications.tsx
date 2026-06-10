import { useState, useEffect } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { TutorApplicationsList } from '../../components/TutorApplicationsList'
import { isTutorRole } from '../../utils/userRole'

export function TutorApplications() {
  const [isAuthorized, setIsAuthorized] = useState(true)

  useEffect(() => {
    const userRaw = localStorage.getItem('user')
    const user = userRaw ? JSON.parse(userRaw) : null
    
    if (!user || !isTutorRole(user.role)) {
      setIsAuthorized(false)
    }
  }, [])

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <i className="fa-regular fa-circle-xmark text-6xl text-red-500 mb-4 block"></i>
          <p className="text-slate-700 font-semibold mb-2">Không được phép truy cập</p>
          <p className="text-slate-500">Chỉ gia sư mới có thể xem danh sách ứng tuyển</p>
        </div>
      </div>
    )
  }

  return (
    <AccountLayout activePath="/tutor/applications">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Các ứng tuyển của tôi</h1>
          <p className="text-slate-600">
            Quản lý tất cả ứng tuyển của bạn cho các bảng tin lớp học
          </p>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <TutorApplicationsList />
        </div>
      </div>
    </AccountLayout>
  )
}
