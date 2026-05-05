type JwtPayload = {
  sub?: string
  email?: string
  name?: string
  fullName?: string
  provider?: string
  exp?: number
  iat?: number
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)

  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  )
}

function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.')

  if (parts.length !== 3) {
    return null
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload
  } catch {
    return null
  }
}

function formatDateTime(timestamp?: number) {
  if (!timestamp) {
    return 'Không có'
  }

  return new Date(timestamp * 1000).toLocaleString('vi-VN')
}

export function OAuth2Redirect() {
  const token = new URLSearchParams(window.location.search).get('token')
  const payload = token ? decodeJwt(token) : null
  const displayName = payload?.name ?? payload?.fullName ?? payload?.sub ?? payload?.email ?? 'Người dùng'
  const displayEmail = payload?.email ?? payload?.sub ?? 'Không xác định'
  const displayProvider = payload?.provider ?? 'oauth2'

  if (token) {
    localStorage.setItem('access_token', token)
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Đăng nhập thành công
        </div>

        <h1 className="text-3xl font-bold text-slate-900">Xin chào, {displayName}</h1>
        <p className="mt-2 text-slate-600">
          Backend đã redirect về trang này sau khi tạo JWT. Bạn có thể dùng token để gọi API và lấy thông tin người dùng.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Email / Subject</p>
            <p className="mt-2 break-words text-lg font-semibold text-slate-900">{displayEmail}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Provider</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{displayProvider}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Issued at</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatDateTime(payload?.iat)}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Expiry</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{formatDateTime(payload?.exp)}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Access Token</p>
          <p className="mt-2 break-all font-mono text-sm text-slate-700">
            {token ?? 'Không nhận được token từ backend'}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Quay về trang đăng nhập
          </a>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('access_token')
              window.location.href = '/'
            }}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Xóa token và đăng nhập lại
          </button>
        </div>
      </div>
    </div>
  )
}