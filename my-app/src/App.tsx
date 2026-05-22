
import "./App.css";
import { Login } from "./pages/Login";
import { ResetPassword } from './pages/ResetPassword';
import { ForgotPassword } from './pages/ForgotPassword'
import { OAuth2Redirect } from "./pages/OAuth2Redirect";
import { Register } from "./pages/Register";
import HomePage from "./pages/HomePage";
import DiscoverTutors from "./pages/DiscoverTutors";
import DiscoverClasses from "./pages/DiscoverClasses";
import { TutorInfo } from "./pages/Tutor/TutorInfo";
import { TutorProfile } from "./pages/Tutor/profile";
import { TutorClasses } from "./pages/Tutor/class";
import { FormAddClass } from "./pages/Tutor/form-add-class";
import { ClassDetail } from "./pages/Tutor/class-detail";
import { TutorSchedule } from "./pages/Tutor/schedule";
import  StudentProfile  from "./pages/Student/StudentProfile";
import { StudentSchedule } from "./pages/Student/schedule";
import { TutorProfileDetail } from "./pages/Tutor/TutorProfileDetail";
import AboutPage from "./pages/AboutPage";
import NotFoundPage from "./pages/NotFoundPage";
import { AdminDashboard } from "./pages/Admin/AdminDashboard";
import { AdminClasses } from "./pages/Admin/AdminClasses";
import { AdminClassDetail } from "./pages/Admin/AdminClassDetail";
import PricingPage from "./pages/PricingPage";


function App() {
  const pathname = window.location.pathname;

  if (pathname === "/") return <HomePage />;
  if (pathname === "/discover/tutors") return <DiscoverTutors />;
  if (pathname === "/discover/classes") return <DiscoverClasses />;
  if (pathname === "/about") return <AboutPage />;
  if (pathname === "/pricing") return <PricingPage />;
  if (pathname === "/login") return <Login />;
  if (pathname === "/register") return <Register />;
  if (pathname === '/forgot-password') return <ForgotPassword />
  if (pathname === '/reset-password') return <ResetPassword />
  if (pathname === "/oauth2/redirect") return <OAuth2Redirect />;
  if (pathname === "/tutor/info") return <TutorInfo />;
  if (pathname === "/tutor/profile") return <TutorProfile />;
  if (pathname === "/tutor/classes") return <TutorClasses />;
  if (pathname === "/tutor/schedule") return <TutorSchedule />;
  if (pathname === "/tutor/classes/new") return <FormAddClass />;
  if (pathname.startsWith("/tutor/classes/") && !pathname.includes("/edit/")) return <ClassDetail />;
  if (pathname.startsWith("/tutor/") && !pathname.includes("/classes")) {
    const tutorId = pathname.split("/")[2];
    if (tutorId && !isNaN(Number(tutorId))) return <TutorProfileDetail />;
  }
  if (pathname === "/student/profile") return <StudentProfile />;
  if (pathname === "/student/schedule") return <StudentSchedule />;
  if (pathname === "/admin") return <AdminDashboard />;
  if (pathname === "/admin/classes") return <AdminClasses />;
  if (pathname.startsWith("/admin/classes/")) return <AdminClassDetail />;

  return <NotFoundPage />;
}

export default App;
