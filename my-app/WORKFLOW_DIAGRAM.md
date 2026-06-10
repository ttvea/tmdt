# 🎯 Quy Trình Ứng Tuyển - Sơ Đồ Alur

## 📊 Quy Trình Ứng Tuyển Toàn Bộ Hệ Thống

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DANH SÁCH BẢNG TIN LỚP HỌC                          │
│                  /discover/student-requests                            │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ [Bảng tin 1]              [Bảng tin 2]              [Bảng tin 3]   │
│  │ Tìm gia sư Toán           Tìm gia sư Tiếng Anh      Tìm gia sư V.Lý│
│  │ Lớp 10 • 2 buổi/tuần      Lớp 12 • 3 buổi/tuần     Lớp 9 • 1 buổi  │
│  │ Offline • 2.5M/tháng      Online • 1M/tháng       Offline • 1.8M   │
│  │                                                                    │
│  │ [Ứng tuyển] ←─┬────────── [Ứng tuyển] ←───────── [Ứng tuyển] ← GIA SƯ │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────┐
        │   MODAL ỨNG TUYỂN                     │
        │  ┌─────────────────────────────────┐ │
        │  │ Ứng tuyển                       │ │
        │  │ ╔═════════════════════════════╗ │ │
        │  │ ║ Thư giới thiệu:             ║ │ │
        │  │ ║ "Xin chào, tôi là gia sư... ║ │ │
        │  │ ║ có 5 năm kinh nghiệm..."    ║ │ │
        │  │ ║                             ║ │ │
        │  │ ║ (tối thiểu 20 ký tự)        ║ │ │
        │  │ ╚═════════════════════════════╝ │ │
        │  │ Hiện tại: 150 ký tự             │ │
        │  │                                 │ │
        │  │ [Hủy] [Ứng tuyển]             │ │
        │  └─────────────────────────────────┘ │
        │  ✓ Gửi API: POST /api/applications   │
        │  ✓ Tạo Application record           │
        │  ✓ Status = PENDING                 │
        └───────────────────────────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────┐
        │  ✓ ỨNG TUYỂN THÀNH CÔNG              │
        │  Toast: "Ứng tuyển thành công!"      │
        │  Modal đóng                          │
        └───────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
    ┌──────────────────────────┐  ┌──────────────────────────┐
    │  GIA SƯ - XEM ỨNG TUYỂN  │  │ HỌC VIÊN - QUẢN LÝ      │
    │  /tutor/applications     │  │ /discover/student-requests/:id │
    │  ┌────────────────────┐  │  │ ┌────────────────────────┐   │
    │  │ [Tất cả: 5]        │  │  │ │ TÌM GIA SƯ TOÁN        │   │
    │  │ [Chờ: 3] [Đã: 1]   │  │  │ │ Lớp 10, 2 buổi/tuần    │   │
    │  │ [Từ: 1]            │  │  │ │ ... (chi tiết đầy đủ)  │   │
    │  │                    │  │  │ │ ┌──────────────────────┐│   │
    │  │ • Ứng tuyển 1      │  │  │ │ │ DANH SÁCH ỨNG TUYỂN: ││   │
    │  │   Chờ xét duyệt    │  │  │ │ │                      ││   │
    │  │                    │  │  │ │ │ • Gia sư A           ││   │
    │  │ • Ứng tuyển 2      │  │  │ │ │   [Chọn] [Từ chối]   ││   │
    │  │   Đã được chọn ✓   │  │  │ │ │ • Gia sư B           ││   │
    │  │                    │  │  │ │ │   [Chọn] [Từ chối]   ││   │
    │  │ • Ứng tuyển 3      │  │  │ │ │ • Gia sư C           ││   │
    │  │   Bị từ chối ✗     │  │  │ │ │   [Chọn] [Từ chối]   ││   │
    │  └────────────────────┘  │  │ │ └──────────────────────┘│   │
    │                          │  │ └────────────────────────┘   │
    │                          │  │                              │
    │ ✓ Xem chi tiết          │  │ ✓ Chấp nhận ứng tuyển       │
    │ ✓ Lọc theo trạng thái    │  │ ✓ Từ chối ứng tuyển        │
    │ ✓ Xem thống kê           │  │ ✓ Các ứng tuyển khác        │
    │                          │  │   tự động bị từ chối       │
    └──────────────────────────┘  └──────────────────────────┘
                    │                       │
                    │                       ▼
                    │        ┌──────────────────────────┐
                    │        │ CHẤP NHẬN ỨNG TUYỂN     │
                    │        │ PUT /api/applications/{id}/accept│
                    │        │                          │
                    │        │ Status: PENDING → ACCEPTED │
                    │        │ Cập nhật status của      │
                    │        │ tất cả ứng tuyển khác    │
                    │        │ → REJECTED              │
                    │        │                          │
                    │        │ StudentRequest.status:   │
                    │        │ → MATCHED                │
                    │        └──────────────────────────┘
                    │                       │
                    │                       ▼
                    │        ┌──────────────────────────┐
                    │        │ ✓ QUÁ TRÌNH HOÀN THÀNH  │
                    │        │ Gia sư được chọn ✓       │
                    │        │ Các gia sư khác nhận    │
                    │        │ trạng thái REJECTED ✗    │
                    │        └──────────────────────────┘
                    │
                    └────────────────────────────────────────────▶
                                Cả hai có thể xem kết quả
                                Status = ACCEPTED hoặc REJECTED
```

---

## 🔄 Chi Tiết Các Trạng Thái

### Status: PENDING (Chờ xét duyệt)
```
┌─ Gia sư ─────────────────────────────────────────┐
│ • Xem ứng tuyển của mình                         │
│ • Chờ học viên xét duyệt                        │
└─────────────────────────────────────────────────┘

┌─ Học viên ────────────────────────────────────────┐
│ • Xem danh sách ứng tuyển từ các gia sư         │
│ • Có nút [Chọn] để chấp nhận                    │
│ • Có nút [Từ chối] để từ chối                   │
└───────────────────────────────────────────────┘
```

### Status: ACCEPTED (Đã chọn)
```
┌─ Gia sư ─────────────────────────────────────────┐
│ ✓ Ứng tuyển được chấp nhận                       │
│ • Hiển thị trong "/tutor/applications"           │
│ • Có thể liên hệ với học viên                    │
└─────────────────────────────────────────────────┘

┌─ Học viên ────────────────────────────────────────┐
│ ✓ Đã chọn gia sư này                             │
│ • Bảng tin có status = MATCHED                  │
│ • Các ứng tuyển khác tự động REJECTED           │
└───────────────────────────────────────────────┘
```

### Status: REJECTED (Bị từ chối)
```
┌─ Gia sư ─────────────────────────────────────────┐
│ ✗ Ứng tuyển bị từ chối                          │
│ • Hiển thị trong "/tutor/applications"           │
│ • Có thể ứng tuyển lại vào bảng tin khác        │
└─────────────────────────────────────────────────┘

┌─ Học viên ────────────────────────────────────────┐
│ • Ứng tuyển này không còn trong danh sách       │
│ • (Khi bảng tin được match)                      │
└───────────────────────────────────────────────┘
```

---

## 📱 Giao Diện & Điều Hướng

```
NAVBAR (Gia sư đã đăng nhập)
│
├─ Trang cá nhân
├─ Lớp học của tôi
├─ Thời khóa biểu
├─ Tin nhắn
├─ Mã giảm giá
├─ [Ứng tuyển] ◄─ NEW!
└─ Hỗ trợ

NAVBAR (Học viên đã đăng nhập)
│
├─ Trang cá nhân
├─ Thời khóa biểu
├─ Tin nhắn
└─ Hỗ trợ
```

---

## 🔗 Routes

### Công Khai
- `GET /discover/student-requests` - Danh sách bảng tin
- `GET /discover/student-requests/:id` - Chi tiết bảng tin

### Dành Cho Gia Sư
- `GET /tutor/applications` - Danh sách ứng tuyển của gia sư
- `POST /api/applications` - Ứng tuyển (từ modal)
- `PUT /api/applications/:id/accept` - Chấp nhận (học viên)
- `PUT /api/applications/:id/reject` - Từ chối (học viên)

### Dành Cho Học Viên
- `GET /api/applications/request/:id` - Lấy ứng tuyển của bảng tin

---

## 💾 Database Schema (Applications)

```sql
CREATE TABLE applications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  
  -- Liên kết
  student_request_id BIGINT NOT NULL,    -- Bảng tin
  tutor_id INT NOT NULL,                 -- Gia sư ứng tuyển
  
  -- Thông tin
  introduction TEXT,                     -- Thư giới thiệu
  status VARCHAR(20),                    -- PENDING, ACCEPTED, REJECTED
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(student_request_id, tutor_id),  -- Một gia sư chỉ ứng tuyển 1 lần
  FOREIGN KEY (student_request_id) REFERENCES student_requests(id),
  FOREIGN KEY (tutor_id) REFERENCES users(id)
);
```

---

## ✨ Tính Năng Bổ Sung (Có Thể Phát Triển Sau)

- [ ] Thông báo real-time khi có ứng tuyển mới
- [ ] Tin nhắn trực tiếp giữa gia sư và học viên
- [ ] Rating/review sau khi kết thúc lớp học
- [ ] Hủy ứng tuyển từ gia sư
- [ ] Báo cáo hoặc chặn gia sư
- [ ] Export danh sách ứng tuyển
- [ ] Gửi email thông báo
- [ ] Analytics cho gia sư (tỷ lệ chấp nhận)
- [ ] Đề xuất ứng tuyển tự động dựa trên profile
