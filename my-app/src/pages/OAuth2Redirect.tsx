import { useEffect, useState } from 'react'
import { getAuthMe, updateMyRole, type AuthUser } from '../api/auth'

export function OAuth2Redirect() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')

    if (!token) {
      setStatus('error')
      setErrorMsg('Không nhận được token từ hệ thống')
      return
    }

    // Lưu token
    localStorage.setItem('access_token', token)

    // Lấy role đã chọn từ sessionStorage (nếu có)
    const pendingRole = sessionStorage.getItem('oauth_pending_role') as 'STUDENT' | 'TUTOR' | null
    // Xóa luôn để không dùng lại cho lần sau
    sessionStorage.removeItem('oauth_pending_role')

    // Gọi API /api/auth/me để lấy thông tin user
    getAuthMe()
      .then(async (user: AuthUser) => {
        // Nếu có pending role và user là provider (social login), cập nhật role
        let finalUser = user
        if (pendingRole && user.provider && user.provider !== 'LOCAL') {
          try {
            finalUser = await updateMyRole(pendingRole)
          } catch (err) {
            console.error('Failed to update role:', err)
          }
        }

        localStorage.setItem('user', JSON.stringify(finalUser))
        setStatus('success')

        // Chuyển hướng về trang chủ sau 1 giây
        setTimeout(() => {
          const role = finalUser.role
          if (role === 'ADMIN') {
            window.location.href = '/admin'
          } else {
            window.location.href = '/'
          }
        }, 1000)
      })
      .catch((err: any) => {
        console.error('Failed to fetch user info:', err)
        setStatus('error')
        setErrorMsg('Không thể lấy thông tin người dùng. Vui lòng thử lại.')
      })
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
        {status === 'loading' && (
          <>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              Đang đăng nhập...
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Vui lòng chờ</h1>
            <p className="mt-2 text-slate-500">Hệ thống đang xác thực tài khoản của bạn...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Đăng nhập thành công
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Đăng nhập thành công!</h1>
            <p className="mt-2 text-slate-500">Bạn sẽ được chuyển hướng về trang chủ...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-700">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Đăng nhập thất bại
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Có lỗi xảy ra</h1>
            <p className="mt-2 text-slate-500">{errorMsg}</p>
            <div className="mt-6">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Quay về trang đăng nhập
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}