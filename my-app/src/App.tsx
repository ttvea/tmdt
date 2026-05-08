import './App.css'
import { ForgotPassword } from './pages/ForgotPassword'
import { Login } from './pages/Login'
import { OAuth2Redirect } from './pages/OAuth2Redirect'
import { ResetPassword } from './pages/ResetPassword'
import { Register } from './pages/Register'


function App() {
  const pathname = window.location.pathname

  if (pathname === '/oauth2/redirect') return <OAuth2Redirect />
  if (pathname === '/forgot-password') return <ForgotPassword />
  if (pathname === '/reset-password') return <ResetPassword />
  if (pathname === '/register') return <Register />

  return <Login />
}

export default App