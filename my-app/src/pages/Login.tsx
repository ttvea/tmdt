import type { FormEvent } from "react";
import { useState } from "react";
import { login } from "../api/auth";
import heroImage from "../assets/hero.png";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";
import { isAdminRole } from "../utils/userRole";
import { API_BASE_URL } from "../api/axios";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function SchoolIcon() {
  return (
    <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-5 9 5-9 5-9-5Zm3 3.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V8a5 5 0 0 1 10 0v3m-9 0h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function EyeIcon({ isVisible }: { isVisible: boolean }) {
  if (isVisible) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 8.5 4.2 9.5 7a11.8 11.8 0 0 1-2.2 3.4M6.6 6.6A12 12 0 0 0 2.5 12c1 2.8 4.5 7 9.5 7 1.6 0 3-.4 4.2-1" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12c1-2.8 4.5-7 9.5-7s8.5 4.2 9.5 7c-1 2.8-4.5 7-9.5 7s-8.5-4.2-9.5-7Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [oauthRole, setOauthRole] = useState<'STUDENT' | 'TUTOR'>('STUDENT');

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await login({ email, password });

      if (!data) {
        throw new Error("Đăng nhập thất bại.");
      }

      if (data.token) {
        localStorage.setItem("access_token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      window.location.href = isAdminRole(data.user?.role) ? "/admin" : "/";
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Đăng nhập thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = () => {

    sessionStorage.setItem('oauth_pending_role', oauthRole);
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  const loginFacebook = () => {
    sessionStorage.setItem('oauth_pending_role', oauthRole);
    window.location.href = "http://localhost:8080/oauth2/authorization/facebook";

    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  const loginFacebook = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/facebook`;

  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex w-full flex-1 items-center justify-center p-0 md:p-6 lg:p-0">
        <div className="flex min-h-[calc(100vh-4rem)] w-full max-w-[1440px] flex-col overflow-hidden bg-white shadow-sm md:min-h-[760px] md:flex-row lg:rounded-xl">
          <section className="relative hidden w-1/2 overflow-hidden bg-blue-800 lg:flex">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-blue-950/90 via-blue-800/45 to-transparent" />
            <img src={heroImage} alt="Nhóm học viên học cùng nhau" className="absolute inset-0 h-full w-full object-cover" />

            <div className="relative z-20 flex h-full w-full flex-col justify-end p-12">
              <div className="max-w-md">
                <div className="mb-3 flex items-center gap-2 text-white">
                  <SchoolIcon />
                  <span className="text-3xl font-bold tracking-tight">EduMatch Pro</span>
                </div>
                <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white">
                  Kết nối tri thức, kiến tạo tương lai
                </h1>
                <p className="mb-12 text-lg leading-8 text-blue-100">
                  Tham gia cùng hàng ngàn sinh viên và gia sư chuyên nghiệp để nâng tầm kiến thức của bạn ngay hôm nay.
                </p>
              </div>

              <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-wide text-white/70">
                <span>Hơn 10,000+ gia sư</span>
                <span>Tỉ lệ đỗ 98%</span>
                <span>Học trực tuyến 24/7</span>
              </div>
            </div>
          </section>

          <section className="flex w-full flex-1 items-center justify-center bg-white px-4 py-10 sm:px-6 md:px-12 lg:w-1/2">
            <div className="flex w-full max-w-[440px] flex-col">
              <a href="/" className="mb-12 flex items-center gap-2 text-blue-700 lg:hidden">
                <SchoolIcon />
                <span className="text-2xl font-black">EduMatch Pro</span>
              </a>

              <div className="mb-12">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Chào mừng quay trở lại</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Vui lòng nhập thông tin để đăng nhập vào tài khoản của bạn.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900" htmlFor="email">
                    Email
                  </label>
                  <div className="group relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-700">
                      <UserIcon />
                    </span>
                    <input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900" htmlFor="password">
                    Mật khẩu
                  </label>
                  <div className="group relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-700">
                      <LockIcon />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-900"
                    >
                      <EyeIcon isVisible={showPassword} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="group flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-700 focus:ring-blue-700" />
                    <span className="text-sm text-slate-500 transition group-hover:text-slate-900">Ghi nhớ đăng nhập</span>
                  </label>
                  <a className="text-sm font-semibold text-blue-700 hover:underline" href="/forgot-password">
                    Quên mật khẩu?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-blue-700 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>

              <div className="my-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Bạn muốn đăng nhập với tư cách</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOauthRole('STUDENT')}
                    className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition ${
                      oauthRole === 'STUDENT'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <svg className="mx-auto mb-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />
                    </svg>
                    Học viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setOauthRole('TUTOR')}
                    className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition ${
                      oauthRole === 'TUTOR'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <svg className="mx-auto mb-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-5 9 5-9 5-9-5Zm3 3.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.5" />
                    </svg>
                    Gia sư
                  </button>
                </div>
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hoặc đăng nhập bằng</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={loginGoogle}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  <GoogleIcon />
                  Google
                </button>
                <button
                  type="button"
                  onClick={loginFacebook}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  <FacebookIcon />
                  Facebook
                </button>
              </div>

              <div className="mt-12 text-center">
                <p className="text-sm text-slate-500">
                  Chưa có tài khoản?
                  <a className="ml-1 font-semibold text-blue-700 hover:underline" href="/register">
                    Đăng ký ngay
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
