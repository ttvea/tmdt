
import "./App.css";
import { Login } from "./pages/Login";
import { ResetPassword } from './pages/ResetPassword';
import { ForgotPassword } from './pages/ForgotPassword'
import { OAuth2Redirect } from "./pages/OAuth2Redirect";
import { Register } from "./pages/Register";
import HomePage from "./pages/HomePage";
import { TutorInfo } from "./pages/Tutor/TutorInfo";
import { TutorProfile } from "./pages/Tutor/profile";
import { TutorClasses } from "./pages/Tutor/class";
import { FormAddClass } from "./pages/Tutor/form-add-class";
import { StudentProfile } from "./pages/Student/StudentProfile";
import AboutPage from "./pages/AboutPage";
import { AdminDashboard } from "./pages/Admin/AdminDashboard";


function App() {
  const pathname = window.location.pathname;

  if (pathname === "/") return <HomePage />;
  if (pathname === "/about") return <AboutPage />;
  if (pathname === "/login") return <Login />;
  if (pathname === "/register") return <Register />;
  if (pathname === '/forgot-password') return <ForgotPassword />
  if (pathname === '/reset-password') return <ResetPassword />
  if (pathname === "/oauth2/redirect") return <OAuth2Redirect />;
  if (pathname === "/tutor/info") return <TutorInfo />;
  if (pathname === "/tutor/profile") return <TutorProfile />;
  if (pathname === "/tutor/classes") return <TutorClasses />;
  if (pathname === "/tutor/classes/new") return <FormAddClass />;
  if (pathname === "/student/profile") return <StudentProfile />;
  if (pathname === "/admin") return <AdminDashboard />;

  return <HomePage />;
}

export default App;
