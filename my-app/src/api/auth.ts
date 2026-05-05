import api from './axios'

type LoginPayload = { email: string; password: string }
type RegisterPayload = { username: string; email: string; password: string; role?: string }

export async function login(payload: LoginPayload) {
  const params = new URLSearchParams({
    email: payload.email,
    password: payload.password,
  }).toString()

  const res = await api.post('/api/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  return res.data
}

export async function register(payload: RegisterPayload) {
  const params = new URLSearchParams({
    username: payload.username,
    email: payload.email,
    password: payload.password,
    role: payload.role ?? 'student',
  }).toString()

  const res = await api.post('/api/auth/register', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  return res.data
}
