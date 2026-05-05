import type { FormEvent } from 'react'
import { useState } from 'react'
import { register } from '../api/auth'

export function Register() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [role, setRole] = useState('student')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)


    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setIsLoading(true)

        try {
            const data = await register({ username: name, email, password, role })

            if (!data) {
                throw new Error('Đăng ký thất bại')
            }

            if (data?.token) {
                localStorage.setItem('access_token', data.token)
            }

            if (data?.user) {
                localStorage.setItem('user', JSON.stringify(data.user))
            }

            window.location.href = `/`
        } catch (regError) {
            setError(regError instanceof Error ? regError.message : 'Đăng ký thất bại')
        } finally {
            setIsLoading(false)
        }
    }

    const loginGoogle = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google'
    }

    const loginFacebook = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/facebook'
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">

                <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>

                <form onSubmit={handleRegister} className="space-y-4">
                    {error ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <div>
                        <label className="block text-sm mb-1">Name</label>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Confirm Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
<div>
                                <label className="block text-sm mb-1">Bạn là</label>
                                <div className="flex gap-4 items-center mt-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="student"
                                            checked={role === 'student'}
                                            onChange={() => setRole('student')}
                                        />
                                        <span className="text-sm">Học viên</span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="tutor"
                                            checked={role === 'tutor'}
                                            onChange={() => setRole('tutor')}
                                        />
                                        <span className="text-sm">Gia sư</span>
                                    </label>
                                </div>
                            </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        {isLoading ? 'Đang đăng ký...' : 'Register'}
                    </button>
                     
                </form>

              
                           
                         

                <div className="space-y-3 mt-6">

                    <button
                        onClick={loginGoogle}
                        className="w-full border flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="google"
                            className="w-5 h-5"
                        />
                        Register with Google
                    </button>

                    <button
                        onClick={loginFacebook}
                        className="w-full border flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                            alt="facebook"
                            className="w-5 h-5"
                        />
                        Register with Facebook
                    </button>

                </div>

                <p className="text-center text-sm mt-6">
                    Already have an account?{' '}
                    <a href="/login" className="text-blue-600 hover:underline">
                        Login
                    </a>
                </p>

            </div>
        </div>
    )
}
