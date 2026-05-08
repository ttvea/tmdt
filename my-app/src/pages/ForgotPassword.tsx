import type { FormEvent } from 'react'
import { useState } from 'react'
import { requestPasswordReset } from '../api/auth'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      await requestPasswordReset({ email })
      setMessage('Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể gửi email đặt lại mật khẩu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-2 text-2xl font-bold text-center">Quên mật khẩu</h2>
        <p className="mb-6 text-sm text-slate-500 text-center">
          Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
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
            <label className="mb-1 block text-sm">Email</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
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