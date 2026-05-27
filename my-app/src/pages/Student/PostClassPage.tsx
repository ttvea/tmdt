import React, { useState } from "react";
import Navbar from "../../layouts/Navbar";
import Footer from "../../layouts/Footer";

const PostClassPage = () => {
  // Chuyển subject và studyTime thành mảng để lưu nhiều giá trị cùng lúc
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    area: "",
    classLevel: "",
    subject: [] as { value: string; label: string }[],
    sessionsPerWeek: "",
    studyTime: [] as { value: string; label: string }[],
    requirements: "",
  });

  // --- CÁC HÀM XỬ LÝ CHỌN NHIỀU & RÀNG BUỘC ---
  const handleAddSubject = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const label = e.target.options[e.target.selectedIndex].text;
    
    // Nếu chưa có trong danh sách đã chọn thì mới thêm vào
    if (value && !formData.subject.find((item) => item.value === value)) {
      setFormData({ ...formData, subject: [...formData.subject, { value, label }] });
    }
  };

  const handleRemoveSubject = (valToRemove: string) => {
    setFormData({
      ...formData,
      subject: formData.subject.filter((item) => item.value !== valToRemove),
    });
  };

  const handleAddTime = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const label = e.target.options[e.target.selectedIndex].text;
    const maxSessions = parseInt(formData.sessionsPerWeek) || 0;

    if (!value) return;

    if (maxSessions === 0) {
      alert("Vui lòng chọn 'Số buổi học / tuần' trước khi chọn thời gian!");
      return;
    }

    if (formData.studyTime.length >= maxSessions) {
      alert(`Bạn chỉ được chọn tối đa ${maxSessions} khoảng thời gian theo thiết lập số buổi!`);
      return;
    }

    if (!formData.studyTime.find((item) => item.value === value)) {
      setFormData({ ...formData, studyTime: [...formData.studyTime, { value, label }] });
    }
  };

  const handleRemoveTime = (valToRemove: string) => {
    setFormData({
      ...formData,
      studyTime: formData.studyTime.filter((item) => item.value !== valToRemove),
    });
  };

  const handleSessionsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      sessionsPerWeek: e.target.value,
      studyTime: [],
    });
  };

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
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        placeholder="Vui lòng nhập số điện thoại"
                        className="w-full border border-slate-300 p-3 text-slate-700 outline-none focus:border-blue-500"
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Khu vực ( Tỉnh, Xã )</label>
                      <input
                        type="text"
                        placeholder="Vui lòng nhập khu vực"
                        className="w-full border border-slate-300 p-3 text-slate-700 outline-none focus:border-blue-500"
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* ---------------- KHUNG 2: CHI TIẾT LỚP HỌC ---------------- */}
                <div className="border border-slate-800 p-8">
                  <i className="fa-solid fa-book text-[50px] text-slate-900 mb-8 block"></i>

                  <div className="space-y-6">
                    {/* --- LỚP HỌC (CHỌN 1) --- */}
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Lớp học</label>
                      <select
                        className="w-full border border-slate-300 p-3 text-slate-500 outline-none focus:border-blue-500 appearance-none bg-transparent"
                        onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                      >
                        <option value="">Vui lòng chọn</option>
                        <option value="0">Mầm non</option>
                        <option value="1">Lớp 1</option>
                        <option value="2">Lớp 2</option>
                        <option value="3">Lớp 3</option>
                        <option value="4">Lớp 4</option>
                        <option value="5">Lớp 5</option>
                        <option value="6">Lớp 6</option>
                        <option value="7">Lớp 7</option>
                        <option value="8">Lớp 8</option>
                        <option value="9">Lớp 9</option>
                        <option value="10">Lớp 10</option>
                        <option value="11">Lớp 11</option>
                        <option value="12">Lớp 12</option>
                        <option value="13">Sinh viên Đại Học</option>
                        <option value="14">Người đi làm</option>
                      </select>
                    </div>

                    {/* --- MÔN HỌC (CHỌN NHIỀU CÓ TAGS) --- */}
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Môn học</label>
                      <div className="w-full border border-slate-300 p-2 min-h-[50px] flex flex-wrap gap-2 items-center focus-within:border-blue-500 transition-colors">
                        {formData.subject.map((sub, idx) => (
                          <span key={idx} className="flex items-center gap-1 bg-white border border-slate-300 px-2 py-1 text-sm text-slate-700 rounded-sm shadow-sm">
                            <span 
                              className="text-slate-400 hover:text-red-500 cursor-pointer font-bold px-1"
                              onClick={() => handleRemoveSubject(sub.value)}
                            >×</span>
                            {sub.label}
                          </span>
                        ))}
                        <select
                          className="flex-1 bg-transparent text-slate-500 outline-none min-w-[120px] py-1 cursor-pointer"
                          onChange={handleAddSubject}
                          value=""
                        >
                          <option value="" disabled>+ Chọn môn học</option>
                          <optgroup label="Trung Học">
                            <option value="math">Toán học</option>
                            <option value="literature">Ngữ văn</option>
                            <option value="physics">Vật lý</option>
                            <option value="chemistry">Hóa học</option>
                            <option value="biology">Sinh học</option>
                            <option value="geography">Địa lí</option>
                            <option value="history">Lịch sử</option>
                            <option value="civics">Giáo dục công dân</option>
                          </optgroup>
                          <optgroup label="Ngoại ngữ">
                            <option value="English">Tiếng Anh</option>
                            <option value="German">Tiếng Đức</option>
                            <option value="Rusian">Tiếng Nga</option>
                            <option value="Japanese">Tiếng Nhật</option>
                            <option value="Korean">Tiếng Hàn</option>
                            <option value="Chinese">Tiếng Trung</option>
                          </optgroup>
                          <optgroup label="Năng khiếu">
                            <option value="music">Âm nhạc</option>
                            <option value="art">Hội họa</option>
                            <option value="chess">Đánh cờ</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {/* --- SỐ BUỔI HỌC --- */}
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Số buổi học / tuần</label>
                      <select
                        className="w-full border border-slate-300 p-3 text-slate-500 outline-none focus:border-blue-500 appearance-none bg-transparent"
                        onChange={handleSessionsChange}
                        value={formData.sessionsPerWeek}
                      >
                        <option value="">Vui lòng chọn</option>
                        <option value="1">1 Buổi</option>
                        <option value="2">2 Buổi</option>
                        <option value="3">3 Buổi</option>
                        <option value="4">4 Buổi</option>
                        <option value="5">5 Buổi</option>
                        <option value="6">6 Buổi</option>
                        <option value="7">7 Buổi</option>
                      </select>
                    </div>

                    {/* --- THỜI GIAN HỌC (CHỌN NHIỀU & RÀNG BUỘC THEO SỐ BUỔI) --- */}
                    <div>
                      <label className="block text-[16px] font-medium text-slate-900 mb-2">Thời gian học</label>
                      <div className="w-full border border-slate-300 p-2 min-h-[50px] flex flex-wrap gap-2 items-center focus-within:border-blue-500 transition-colors">
                        {formData.studyTime.map((time, idx) => (
                          <span key={idx} className="flex items-center gap-1 bg-white border border-slate-300 px-2 py-1 text-sm text-slate-700 rounded-sm shadow-sm">
                            <span 
                              className="text-slate-400 hover:text-red-500 cursor-pointer font-bold px-1"
                              onClick={() => handleRemoveTime(time.value)}
                            >×</span>
                            {time.label}
                          </span>
                        ))}
                        <select
                          className="flex-1 bg-transparent text-slate-500 outline-none min-w-[150px] py-1 cursor-pointer"
                          onChange={handleAddTime}
                          value=""
                          disabled={!formData.sessionsPerWeek || formData.studyTime.length >= parseInt(formData.sessionsPerWeek)}
                        >
                          <option value="" disabled>
                            {!formData.sessionsPerWeek 
                              ? "Vui lòng chọn số buổi trước" 
                              : formData.studyTime.length >= parseInt(formData.sessionsPerWeek) 
                                ? "Đã chọn đủ số buổi" 
                                : "+ Chọn thời gian"}
                          </option>
                          <optgroup label="Buổi sáng (7h - 11h)">
                            <option value="morning_2">Thứ Hai</option>
                            <option value="morning_3">Thứ Ba</option>
                            <option value="morning_4">Thứ Tư</option>
                            <option value="morning_5">Thứ Năm</option>
                            <option value="morning_6">Thứ Sáu</option>
                            <option value="morning_7">Thứ Bảy</option>
                            <option value="morning_8">Chủ Nhật</option>
                          </optgroup>

                          <optgroup label="Buổi Chiều (1h - 5h)">
                            <option value="afternoon_2">Thứ Hai</option>
                            <option value="afternoon_3">Thứ Ba</option>
                            <option value="afternoon_4">Thứ Tư</option>
                            <option value="afternoon_5">Thứ Năm</option>
                            <option value="afternoon_6">Thứ Sáu</option>
                            <option value="afternoon_7">Thứ Bảy</option>
                            <option value="afternoon_8">Chủ Nhật</option>
                          </optgroup>

                          <optgroup label="Buổi Tối (6h - 10h)">
                            <option value="night_2">Thứ Hai</option>
                            <option value="night_3">Thứ Ba</option>
                            <option value="night_4">Thứ Tư</option>
                            <option value="night_5">Thứ Năm</option>
                            <option value="night_6">Thứ Sáu</option>
                            <option value="night_7">Thứ Bảy</option>
                            <option value="night_8">Chủ Nhật</option>
                          </optgroup>
                        </select>
                      </div>
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
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
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