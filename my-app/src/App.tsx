import { useEffect } from "react";
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
import { AdminUsers } from "./pages/Admin/AdminUsers";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import FaqPage from "./pages/FaqPage";
import PostClassPage from "./pages/Student/PostClassPage";

const pageTitles: Record<string, string> = {
  "/": "EduMatch Pro - Kết nối gia sư 1 kèm 1",
  "/discover/tutors": "Tìm gia sư - EduMatch Pro",
  "/discover/classes": "Tìm lớp học - EduMatch Pro",
  "/about": "Giới thiệu - EduMatch Pro",
  "/pricing": "Học phí - EduMatch Pro",
  "/faq": "Hỏi đáp - EduMatch Pro",
  "/contact": "Liên hệ - EduMatch Pro",
  "/login": "Đăng nhập - EduMatch Pro",
  "/register": "Đăng ký - EduMatch Pro",
  "/forgot-password": "Quên mật khẩu - EduMatch Pro",
  "/reset-password": "Đặt lại mật khẩu - EduMatch Pro",
  "/oauth2/redirect": "Đang đăng nhập - EduMatch Pro",
  "/tutor/info": "Thông tin gia sư - EduMatch Pro",
  "/tutor/profile": "Hồ sơ gia sư - EduMatch Pro",
  "/tutor/classes": "Lớp của gia sư - EduMatch Pro",
  "/tutor/schedule": "Lịch dạy - EduMatch Pro",
  "/tutor/classes/new": "Tạo lớp học - EduMatch Pro",
  "/student/profile": "Hồ sơ học viên - EduMatch Pro",
  "/student/schedule": "Lịch học - EduMatch Pro",
  "/admin": "Quản trị - EduMatch Pro",
  "/admin/users": "Quản lý người dùng - EduMatch Pro",
  "/admin/classes": "Quản lý lớp học - EduMatch Pro",
  "/post-class": "Đăng lớp - EduMatch Pro",
};

function getPageTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/tutor/classes/")) return "Chi tiết lớp học - EduMatch Pro";
  if (pathname.startsWith("/tutor/")) return "Chi tiết gia sư - EduMatch Pro";
  if (pathname.startsWith("/admin/classes/")) return "Duyệt lớp học - EduMatch Pro";
  return "Không tìm thấy trang - EduMatch Pro";
}

function App() {
  const pathname = window.location.pathname;

  useEffect(() => {
    document.title = getPageTitle(pathname);
  }, [pathname]);

  if (pathname === "/") return <HomePage />;
  if (pathname === "/discover/tutors") return <DiscoverTutors />;
  if (pathname === "/discover/classes") return <DiscoverClasses />;
  if (pathname === "/about") return <AboutPage />;
  if (pathname === "/pricing") return <PricingPage />;
  if (pathname === "/faq") return <FaqPage />;
  if (pathname === "/contact") return <ContactPage />;
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
  if (pathname === "/admin/users") return <AdminUsers />;
  if (pathname === "/admin/classes") return <AdminClasses />;
  if (pathname.startsWith("/admin/classes/")) return <AdminClassDetail />;
  if (pathname === "/post-class") return <PostClassPage />;


  return <NotFoundPage />;
}

export default App;
