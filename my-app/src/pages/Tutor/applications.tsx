import { useEffect, useState } from 'react'
import { AccountLayout } from '../../components/AccountLayout'
import { AccountPageContainer } from '../../components/AccountPageContainer'
import { TutorApplicationsList } from '../../components/TutorApplicationsList'
import { TutorPageHeader } from '../../components/TutorPageHeader'
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
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <i className="fa-regular fa-circle-xmark mb-4 block text-6xl text-red-500"></i>
          <p className="mb-2 font-semibold text-slate-700">Không được phép truy cập</p>
          <p className="text-slate-500">Chỉ gia sư mới có thể xem danh sách ứng tuyển</p>
        </div>
      </div>
    )
  }

  return (
    <AccountLayout activePath="/tutor/applications">
      <AccountPageContainer className="space-y-6">
        <TutorPageHeader title="Ứng tuyển" />

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <TutorApplicationsList />
        </div>
      </AccountPageContainer>
    </AccountLayout>
  )
}
