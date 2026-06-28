import { useState, useEffect } from "react";
import Navbar from "../../layouts/Navbar";
import Footer from "../../layouts/Footer";
import { ApplicationModal } from "../../components/ApplicationModal";
import { isTutorRole } from "../../utils/userRole";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../api/axios";

type StudentRequest = {
  id: number;
  contactName: string;
  address: string;
  subjectTags: string;
  gradeLevel: string;
  studyTimeTags: string;
  teachingMode: "ONLINE" | "OFFLINE";
  sessionsPerWeek: number;
  budget: number;
  requirements: string;
  createdAt: string;
};

const StudentRequestsList = () => {
  const [keyword, setKeyword] = useState("");
  const [subject, setSubject] = useState("");
  const [mode, setMode] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isTutor = user ? isTutorRole(user.role) : false;
  
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gọi API mỗi khi filter thay đổi
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        // Xây dựng query string từ các state hiện tại
        const queryParams = new URLSearchParams();
        if (keyword) queryParams.append("keyword", keyword);
        if (subject) queryParams.append("subject", subject);
        if (mode) queryParams.append("mode", mode);
        
        const queryString = queryParams.toString();
        // Gọi thẳng vào API /search đã viết ở Backend
        const url = `${API_BASE_URL}/api/student-requests/search${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setRequests(data.data);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Áp dụng Debounce: Đợi 500ms sau khi ngừng thao tác mới gọi API
    const delayDebounceFn = setTimeout(() => {
      fetchRequests();
    }, 500);

    // Dọn dẹp timeout cũ nếu user thao tác liên tục
    return () => clearTimeout(delayDebounceFn);
  }, [keyword, subject, mode]);

  const handleApplyClick = (requestId: number) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để ứng tuyển");
      window.location.href = "/login";
      return;
    }

    if (!isTutor) {
      toast.error("Chỉ gia sư mới có thể ứng tuyển");
      return;
    }

    setSelectedRequestId(requestId);
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    toast.success("Ứng tuyển thành công!");
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <Navbar />

      {isLoading && (
        <div className="bg-blue-50 px-4 py-2 text-center text-sm font-semibold text-blue-700">
          Đang tải bảng tin lớp học...
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div className=" bg-[#d9e8fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-200" style={{ color: "#e2e8f0" }}>
            <span className="!text-blue-900">Bảng tin lớp học</span> 
          </h1>
          <div className="flex items-center gap-3">
            <div className="bg-cyan-50 border border-cyan-100 text-cyan-800 px-4 py-1.5 rounded-full text-sm font-medium">
              <span className="font-bold">{requests.length}</span> lớp học
            </div>
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-medium">
              <span className="font-bold">{requests.filter(r => r.teachingMode === 'ONLINE').length}</span> lớp trực tuyến
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto py-8 px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ================= CỘT TRÁI: THANH BỘ LỌC ================= */}
          <aside className="w-full lg:w-[300px] shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold !text-slate-800">Bộ lọc</h2>
                <button 
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  onClick={() => { setKeyword(""); setSubject(""); setMode(""); }}
                >
                  Xóa lọc
                </button>
              </div>

              <div className="space-y-5">
                {/* Từ khóa */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Từ khóa</label>
                  <input
                    type="text"
                    placeholder="Tên môn, khu vực..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 transition-all"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>

                {/* Môn học */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Môn dạy</label>
<select
  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 bg-white"
  value={subject}
  onChange={(e) => setSubject(e.target.value)}
>
  <option value="">Tất cả môn học</option>
  <optgroup label="Trung Học">
    <option value="Toán học">Toán học</option>
    <option value="Ngữ văn">Ngữ văn</option>
    <option value="Vật lý">Vật lý</option>
    <option value="Hóa học">Hóa học</option>
    <option value="Sinh học">Sinh học</option>
    <option value="Địa lí">Địa lí</option>
    <option value="Lịch sử">Lịch sử</option>
    <option value="Giáo dục công dân">Giáo dục công dân</option>
  </optgroup>
  <optgroup label="Ngoại ngữ">
    <option value="Tiếng Anh">Tiếng Anh</option>
    <option value="Tiếng Đức">Tiếng Đức</option>
    <option value="Tiếng Nga">Tiếng Nga</option>
    <option value="Tiếng Nhật">Tiếng Nhật</option>
    <option value="Tiếng Hàn">Tiếng Hàn</option>
    <option value="Tiếng Trung">Tiếng Trung</option>
  </optgroup>
  <optgroup label="Năng khiếu">
    <option value="Âm nhạc">Âm nhạc</option>
    <option value="Hội họa">Hội họa</option>
    <option value="Đánh cờ">Đánh cờ</option>
  </optgroup>
</select>
                </div>

                {/* Cấp học */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cấp học</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">Tất cả cấp học</option>
                    <option value="cap1">Cấp 1</option>
                    <option value="cap2">Cấp 2</option>
                    <option value="cap3">Cấp 3</option>
                  </select>
                </div>

                {/* Hình thức học */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hình thức học</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 bg-white"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    <option value="OFFLINE">Tại nhà (Offline)</option>
                    <option value="ONLINE">Trực tuyến (Online)</option>
                  </select>
                </div>

              </div>
            </div>
          </aside>

          {/* ================= CỘT PHẢI: DANH SÁCH BÀI ĐĂNG ================= */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600 text-sm">
                Hiển thị <span className="font-bold text-slate-900">{requests.length}</span> lớp học phù hợp
              </p>
            </div>

            {requests.length === 0 && !isLoading ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-slate-500 font-medium">Không tìm thấy lớp học nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {requests.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col h-full group">
                    
                    {/* Header Card: Mã lớp & Trạng thái */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                          <i className="fa-solid fa-book-open text-xl"></i>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                            Tìm gia sư {req.subjectTags}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">Mã lớp: LH{req.id} • Đăng ngày {req.createdAt}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tags Môn học & Hình thức */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {req.gradeLevel}
                      </span>
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {req.sessionsPerWeek} buổi/tuần
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${req.teachingMode === 'ONLINE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {req.teachingMode === 'ONLINE' ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    {/* Mô tả chi tiết */}
                    <div className="text-sm text-slate-600 space-y-2 mb-5 flex-1">
                      <p className="flex items-start gap-2">
                        <i className="fa-solid fa-location-dot mt-1 text-slate-400 w-4 text-center"></i>
                        <span className="line-clamp-1">{req.address}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <i className="fa-regular fa-clock mt-1 text-slate-400 w-4 text-center"></i>
                        <span className="line-clamp-2">{req.studyTimeTags}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <i className="fa-regular fa-comment mt-1 text-slate-400 w-4 text-center"></i>
                        <span className="line-clamp-2">{req.requirements}</span>
                      </p>
                    </div>

                    {/* Footer Card: Học phí & Nút hành động */}
                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-auto">
                      <div>
                        <span className="block text-xs text-slate-500 mb-0.5">Học phí dự kiến</span>
                        <span className="font-bold text-lg text-slate-800">
                          {req.budget.toLocaleString("vi-VN")} đ <span className="text-sm font-normal text-slate-500">/tháng</span>
                        </span>
                      </div>
                      <button 
                        onClick={() => handleApplyClick(req.id)}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-5 rounded-md text-sm transition-colors shadow-sm"
                      >
                        Yêu cầu dạy
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
            
            {/* Phân trang */}
            <div className="mt-8 flex justify-center">
               <nav className="flex items-center gap-2">
                  <button className="w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center transition-colors">
                     ‹
                  </button>
                  <button className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center shadow-sm">
                     1
                  </button>
                  <button className="w-10 h-10 rounded-full border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center transition-colors">
                     2
                  </button>
                  <button className="w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center transition-colors">
                     ›
                  </button>
               </nav>
            </div>
          </div>

        </div>
      </main>

      {showApplicationModal && selectedRequestId && (
        <ApplicationModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          requestId={selectedRequestId}
          onSuccess={handleApplicationSuccess}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default StudentRequestsList;
