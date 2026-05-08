import type { FormEvent } from 'react'
import { useState } from 'react'
import { login } from '../api/auth'

export function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const data = await login({ email, password })

            if (!data) {
                throw new Error('Đăng nhập thất bại')
            }

            if (data.token) {
                localStorage.setItem('access_token', data.token)
            }

            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user))
            }

            window.location.href = `/oauth2/redirect?token=${encodeURIComponent(data.token)}`
        } catch (loginError) {
            setError(loginError instanceof Error ? loginError.message : 'Đăng nhập thất bại')
        } finally {
            setIsLoading(false)
        }
    }

    const loginGoogle = () => {
        window.location.href = "http://localhost:8080/oauth2/authorization/google";
    }

    const loginFacebook = () => {
        window.location.href = "http://localhost:8080/oauth2/authorization/facebook";
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">

                <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    {/* Email */}
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

                    {/* Password */}
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

                    {/* Remember me */}
                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" />
                            Remember me
                        </label>

                        <a href="/forgot-password" className="text-blue-600 hover:underline">
                            Forgot password?
                        </a>
                    </div>

                    {/* Login button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        {isLoading ? 'Đang đăng nhập...' : 'Login'}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center my-6">
                    <div className="flex-1 border-t"></div>
                    <span className="px-3 text-gray-400 text-sm">or</span>
                    <div className="flex-1 border-t"></div>
                </div>

                {/* Social login */}
                <div className="space-y-3">

                    <button
                        onClick={loginGoogle}
                        className="w-full border flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="google"
                            className="w-5 h-5"
                        />
                        Login with Google
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
                        Login with Facebook
                    </button>

                </div>

                {/* Register */}
                <p className="text-center text-sm mt-6">
                    Don’t have an account?{" "}
                    <a href="/register" className="text-blue-600 hover:underline">
                        Register
                    </a>
                </p>

            </div>
        </div>
    );
}