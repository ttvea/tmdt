import axios from 'axios'
import api from './axios'

type LoginPayload = { email: string; password: string }
type RegisterPayload = { username: string; email: string; password: string; role?: string }
type RequestResetPasswordPayload = { email: string }
type ResetPasswordPayload = { token: string; password: string }

export interface AuthUser {
  id: number
  email: string
  fullName: string
  phone: string | null
  avatar: string | null
  birthday: string | null
  gender: string | null
  role: string | null
  provider: string | null
  enabled: boolean | null
  verified: boolean | null
}

export async function login(payload: LoginPayload) {
  const params = new URLSearchParams({
    email: payload.email,
    password: payload.password,
  }).toString()

  try {
    const res = await api.post('/api/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    return res.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(String(error.response.data))
    }
    throw error
  }
}

export async function register(payload: RegisterPayload) {
  const role = payload.role ? payload.role.toUpperCase() : 'STUDENT'
  const params = new URLSearchParams({
    username: payload.username,
    email: payload.email,
    password: payload.password,
    role,
  }).toString()

  const res = await api.post('/api/auth/register', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  return res.data
}

export async function requestPasswordReset(payload: RequestResetPasswordPayload) {
  const params = new URLSearchParams({
    email: payload.email,
  }).toString()

  const res = await api.post('/api/auth/forgot-password', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  return res.data
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const params = new URLSearchParams({
    token: payload.token,
    newPassword: payload.password,
  }).toString()

  const res = await api.post('/api/auth/reset-password', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  return res.data
}

export async function getAuthMe(): Promise<AuthUser> {
  const res = await api.get('/api/auth/me')
  return res.data
}

export async function updateMyRole(role: 'STUDENT' | 'TUTOR'): Promise<AuthUser> {
  const res = await api.patch('/api/auth/me/role', { role })
  return res.data
}
