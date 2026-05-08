import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { resetPassword } from '../api/auth'

function getTokenFromLocation() {
  return new URLSearchParams(window.location.search).get('token') ?? ''
}

export function ResetPassword() {
  const token = useMemo(() => getTokenFromLocation(), [])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('Thiếu token đặt lại mật khẩu trong đường dẫn.')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setIsLoading(true)

    try {
      await resetPassword({ token, password })
      setMessage('Đặt lại mật khẩu thành công. Bạn sẽ được chuyển về trang đăng nhập sau 2 giây.')
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Không thể đặt lại mật khẩu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-2 text-2xl font-bold text-center">Đặt lại mật khẩu</h2>
        <p className="mb-6 text-sm text-slate-500 text-center">
          Tạo mật khẩu mới cho tài khoản của bạn.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm">Mật khẩu mới</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Xác nhận mật khẩu</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <a href="/" className="text-blue-600 hover:underline">
            Quay lại đăng nhập
          </a>
        </p>
      </div>
    </div>
  )
}