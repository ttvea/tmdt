import { useState } from "react";
import Navbar from "../../layouts/Navbar";
import Footer from "../../layouts/Footer";

const PostClassPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    area: "",
    classLevel: "",
    subject: "",
    sessionsPerWeek: "",
    studyTime: "",
    requirements: "",
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      {/* ================= VẠCH NGANG TIÊU ĐỀ ================= */}
      <div className="bg-[#d9e8fb] py-12 text-center">
        <h1 className="text-4xl font-bold !text-blue-900 mb-2">
          Học Viên đăng Lớp
        </h1>
        <p className="text-lg text-slate-600">
          Tìm gia sư tận tâm, giúp việc học tập trở nên dễ dàng
        </p>
      </div>
      
      <main className="flex-1 w-full max-w-7xl mx-auto py-10 px-4 sm:px-6">
        
        {/* ================= KHUNG CHỨA TOÀN BỘ ================= */}
        <div className="flex flex-col lg:flex-row bg-white shadow-xl min-h-[800px] overflow-hidden rounded-2xl border border-slate-200">
          
          {/* ================= CỘT TRÁI (NỀN XANH LƠ) ================= */}
          <div className="bg-[#00a8e8] w-full lg:w-[350px] flex items-center justify-center py-20 lg:py-0 shrink-0">
            <i className="fa-regular fa-file-lines text-white text-[150px]"></i>
          </div>

          {/* ================= CỘT PHẢI (FORM NHẬP LIỆU) ================= */}
          <div className="flex-1 p-8 lg:p-14">
            
            <div className="mb-10">
              <h2 className="text-3xl font-medium !text-blue-900 inline-block border-b-[5px] border-blue-500 pb-2">
                Thông tin lớp học
              </h2>
            </div>

            <form className="w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* ---------------- KHUNG 1: THÔNG TIN CÁ NHÂN ---------------- */}
                <div className="border border-slate-800 p-8">
                  <i className="fa-solid fa-graduation-cap text-[50px] text-slate-900 mb-8 block"></i>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Tên học viên / phụ huynh</label>
                      <input 
                        type="text" 
                        placeholder="Vui lòng nhập tên"
                        className="w-full border border-slate-300 p-3 text-slate-700 outline-none focus:border-blue-500"
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Số điện thoại</label>
                      <input 
                        type="tel" 
                        placeholder="Vui lòng nhập số điện thoại"
                        className="w-full border border-slate-300 p-3 text-slate-700 outline-none focus:border-blue-500"
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Khu vực ( Tỉnh, Xã )</label>
                      <input 
                        type="text" 
                        placeholder="Vui lòng nhập khu vực"
                        className="w-full border border-slate-300 p-3 text-slate-700 outline-none focus:border-blue-500"
                        onChange={(e) => setFormData({...formData, area: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* ---------------- KHUNG 2: CHI TIẾT LỚP HỌC ---------------- */}
                <div className="border border-slate-800 p-8">
                  <i className="fa-solid fa-book text-[50px] text-slate-900 mb-8 block"></i>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Lớp học</label>
                      <select 
                        className="w-full border border-slate-300 p-3 text-slate-500 outline-none focus:border-blue-500 appearance-none bg-transparent"
                        onChange={(e) => setFormData({...formData, classLevel: e.target.value})}
                      >
                        <option value="">Vui lòng chọn</option>
                        <option value="1">Lớp 1</option>
                        <option value="2">Lớp 2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Môn học</label>
                      <select 
                        className="w-full border border-slate-300 p-3 text-slate-500 outline-none focus:border-blue-500 appearance-none bg-transparent"
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      >
                        <option value="">Vui lòng chọn</option>
                        <option value="math">Toán học</option>
                        <option value="literature">Ngữ văn</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Số buổi học / tuần</label>
                      <select 
                        className="w-full border border-slate-300 p-3 text-slate-500 outline-none focus:border-blue-500 appearance-none bg-transparent"
                        onChange={(e) => setFormData({...formData, sessionsPerWeek: e.target.value})}
                      >
                        <option value="">Vui lòng chọn</option>
                        <option value="2">2 buổi</option>
                        <option value="3">3 buổi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Thời gian học</label>
                      <select 
                        className="w-full border border-slate-300 p-3 text-slate-500 outline-none focus:border-blue-500 appearance-none bg-transparent"
                        onChange={(e) => setFormData({...formData, studyTime: e.target.value})}
                      >
                        <option value="">Vui lòng chọn</option>
                        <option value="evening">Buổi tối</option>
                        <option value="weekend">Cuối tuần</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* ---------------- KHUNG 3: YÊU CẦU KHÁC ---------------- */}
              <div className="mt-10">
                <label className="block text-[16px] font-medium text-slate-900 mb-2">Yêu cầu khác</label>
                <textarea 
                  rows={5}
                  placeholder="1. Mục tiêu (Kèm bài tập, luyện thi...) &#10;2. Gia sư (Giới tính, trình độ học vấn ... )"
                  className="w-full border border-slate-900 p-4 text-slate-700 outline-none focus:border-blue-500 resize-none"
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                ></textarea>
              </div>

              {/* ---------------- NÚT SUBMIT ---------------- */}
              <button 
                type="button" 
                className="mt-8 bg-[#00a859] hover:bg-green-700 text-white font-medium text-lg px-8 py-3 flex items-center justify-center gap-3 transition-colors"
                onClick={() => console.log(formData)}
              >
                Đăng tìm gia sư <i className="fa-solid fa-arrow-right"></i>
              </button>

            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PostClassPage;
