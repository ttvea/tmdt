import type { FormEvent } from "react";
import { useState } from "react";
import { register } from "../api/auth";
import Footer from "../layouts/Footer";
import Navbar from "../layouts/Navbar";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
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

function RoleIcon({ type }: { type: "tutor" | "student" }) {
  if (type === "tutor") {
    return (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5V6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75V19.5M8 8h8M8 12h5M6 20h12" />
      </svg>
    );
  }

  return (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" />
    </svg>
  );
}

function FeatureIcon({ children }: { children: string }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
      {children}
    </div>
  );
}

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"student" | "tutor">("tutor");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!acceptedTerms) {
      setError("Vui lòng đồng ý với điều khoản dịch vụ và chính sách bảo mật.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await register({ username: name, email, password, role });

      if (!data) {
        throw new Error("Đăng ký thất bại.");
      }

      if (data.token) {
        localStorage.setItem("access_token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      window.location.href = "/";
    } catch (regError) {
      setError(regError instanceof Error ? regError.message : "Đăng ký thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  const loginFacebook = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/facebook";
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-slate-900">
      <Navbar />

      <main className="flex w-full flex-1 flex-col bg-white md:flex-row">
        <section className="relative hidden min-h-[calc(100vh-4rem)] overflow-hidden bg-blue-800 md:flex md:w-1/2">
          <div className="absolute inset-0 h-full w-full">
      <img
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAA9usdSkw56XxzI50kg9Eu8S_gNS_YNJHmgjkqwG9Gw1_Zh-LcBYQAO_EgWGxQETCiTzh0HBqKQYwswymWHQJvKDx-cr-xwPx3ZqIV0Z14v5xpQ3lCm5_wWjylmWgcpguMTmCJZdzvX4ayRKsK8SAc0fgJ6U38OrahscOdeypB3OQKBOocaAlVO-KK4Hh4An1i62dyyF2fdhkLR_OHDL2XVtQmT6L6VH2UzAPTkuT6BGWY7lEn2uOdCGFW37cRX9GggBz4e8DJtns"
        alt="Students Collaborating"
        className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-60"
      />
    </div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-blue-800/80 to-cyan-700/70" />

          <div className="relative z-10 flex flex-col justify-center px-12 text-white lg:px-16">
            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight">
              Mở khóa tương lai cùng EduMatch Pro
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-blue-50/90">
              Nền tảng kết nối gia sư và học viên hàng đầu Việt Nam, giúp bạn tìm
              thấy lộ trình học tập tối ưu và những chuyên gia tận tâm.
            </p>

            <div className="mt-12 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <FeatureIcon>✓</FeatureIcon>
                <p className="font-medium text-blue-50">Hơn 10,000 gia sư được xác thực</p>
              </div>
              <div className="flex items-center gap-4">
                <FeatureIcon>★</FeatureIcon>
                <p className="font-medium text-blue-50">Lộ trình học tập cá nhân hóa</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center bg-white px-4 py-10 sm:px-6 md:w-1/2 md:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Tạo tài khoản mới
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Bắt đầu hành trình giáo dục của bạn ngay hôm nay.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-600">Loại tài khoản</legend>
                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition hover:border-blue-700 ${
                      role === "tutor"
                        ? "border-blue-700 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <input
                      className="sr-only"
                      name="account_type"
                      type="radio"
                      value="tutor"
                      checked={role === "tutor"}
                      onChange={() => setRole("tutor")}
                    />
                    <RoleIcon type="tutor" />
                    <span className="mt-2 text-sm font-semibold">Tôi là gia sư</span>
                    {role === "tutor" ? (
                      <span className="absolute right-2 top-2 text-sm font-bold">✓</span>
                    ) : null}
                  </label>

                  <label
                    className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition hover:border-blue-700 ${
                      role === "student"
                        ? "border-blue-700 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <input
                      className="sr-only"
                      name="account_type"
                      type="radio"
                      value="student"
                      checked={role === "student"}
                      onChange={() => setRole("student")}
                    />
                    <RoleIcon type="student" />
                    <span className="mt-2 text-sm font-semibold">Tôi là học viên</span>
                    {role === "student" ? (
                      <span className="absolute right-2 top-2 text-sm font-bold">✓</span>
                    ) : null}
                  </label>
                </div>
              </fieldset>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-600" htmlFor="name">
                  Họ và tên
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-600" htmlFor="email">
                  Địa chỉ Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="example@edumatch.vn"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-600" htmlFor="password">
                    Mật khẩu
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="block text-sm font-semibold text-slate-600"
                    htmlFor="confirm_password"
                  >
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                />
                <label className="text-sm leading-6 text-slate-600" htmlFor="terms">
                  Tôi đồng ý với các{" "}
                  <a className="font-semibold text-blue-700 hover:underline" href="#">
                    Điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a className="font-semibold text-blue-700 hover:underline" href="#">
                    Chính sách bảo mật
                  </a>{" "}
                  của EduMatch.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-blue-700 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>

            <p className="mt-8 text-center text-base text-slate-600">
              Đã có tài khoản?{" "}
              <a className="font-bold text-blue-700 hover:underline" href="/login">
                Đăng nhập
              </a>
            </p>

            <div className="relative mt-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500">Hoặc đăng ký nhanh bằng</span>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={loginGoogle}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <GoogleIcon />
                Google
              </button>

              <button
                type="button"
                onClick={loginFacebook}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FacebookIcon />
                Facebook
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
