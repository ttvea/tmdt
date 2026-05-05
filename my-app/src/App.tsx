import './App.css'
import { Login } from './pages/Login'
import { OAuth2Redirect } from './pages/OAuth2Redirect'
import { Register } from './pages/Register'


function App() {
  const pathname = window.location.pathname

  if (pathname === '/oauth2/redirect') return <OAuth2Redirect />
  if (pathname === '/register') return <Register />

  return <Login />
}

export default App