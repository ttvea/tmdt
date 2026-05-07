import "./App.css";
import { Login } from "./pages/Login";
import { OAuth2Redirect } from "./pages/OAuth2Redirect";
import { Register } from "./pages/Register";
import HomePage from "./pages/HomePage";

function App() {
  const pathname = window.location.pathname;

  if (pathname === "/") return <HomePage />;
  if (pathname === "/login") return <Login />;
  if (pathname === "/register") return <Register />;
  if (pathname === "/oauth2/redirect") return <OAuth2Redirect />;

  return <HomePage />;
}

export default App;