# 📋 Trang Danh Sách Bảng Tin Của Học Viên

## 🎯 Tính Năng Được Thêm

Đã triển khai UI hoàn chỉnh để hiển thị **danh sách các bảng tin của học viên kèm theo các ứng tuyển từ gia sư**.

---

## 📦 Files Tạo Mới

### 1. **API File** - `src/api/studentRequests.ts`
```typescript
- getMyStudentRequests()                    // Lấy danh sách bảng tin của học viên
- getStudentRequestWithApplications()       // Lấy chi tiết bảng tin + ứng tuyển
- StudentRequestsWithApplications           // Interface chứa bảng tin + ứng tuyển
- ApplicationSummary                        // Interface tóm tắt ứng tuyển
```

### 2. **Component Card** - `src/components/StudentRequestCard.tsx`
- Hiển thị thẻ bảng tin với:
  - Thông tin môn học, lớp, buổi/tuần, học phí
  - Thông tin liên hệ (tên, số điện thoại, địa chỉ)
  - Thống kê ứng tuyển (Tất cả, Chờ xét, Đã chọn, Từ chối)
  - Danh sách ứng tuyển (có thể expand/collapse)
  - Nút quản lý (chấp nhận/từ chối)
  - Trạng thái bảng tin (Đang tìm / Đã match)

### 3. **Page** - `src/pages/Student/MyStudentRequests.tsx`
- Trang quản lý bảng tin của học viên tại `/student/my-requests`
- **Tính năng:**
  - 📊 Thống kê: Tất cả, Đang tìm, Đã match, Tổng ứng tuyển, Chờ xét duyệt
  - 🔍 Bộ lọc: Lọc theo trạng thái (Tất cả / Đang tìm / Đã match)
  - 📅 Sắp xếp: Mới nhất / Cũ nhất
  - 🔄 Làm mới: Reload dữ liệu
  - 📋 Danh sách: Hiển thị tất cả bảng tin dưới dạng card
  - ⚠️ Trạng thái trống: Hiển thị khi không có bảng tin

---

## 📊 Giao Diện Chi Tiết

### Thống Kê (Statistics)
```
┌─────────────┬────────────┬──────────┬──────────────┬──────────────┐
│ Tất cả: 5   │ Đang: 3    │ Match: 2 │ Ứng Tuyển: 15│ Chờ Xét: 8   │
└─────────────┴────────────┴──────────┴──────────────┴──────────────┘
```

### Bộ Lọc & Sắp Xếp
```
Lọc: [Tất cả] [Đang tìm] [Đã match]     Sắp xếp: [Mới nhất ▼]  [🔄 Làm mới]
```

### Thẻ Bảng Tin
```
┌──────────────────────────────────────────────────────────────────┐
│ Tìm gia sư Toán                                     [Đang tìm]   │
│ Mã bảng tin: LH123                                               │
├──────────────────────────────────────────────────────────────────┤
│ Lớp 10 | 2 buổi/tuần | Online | 2,000,000 đ                    │
│                                                                  │
│ Liên hệ: Nguyễn Văn A                                           │
│ Số ĐT: 0987654321                                               │
│ Địa chỉ: Hà Nội                                                 │
├──────────────────────────────────────────────────────────────────┤
│ Ứng tuyển                                   [Ẩn ▲] / [Xem ▼]   │
│ ┌─────────────┬────────────┬──────────┬─────────────┐          │
│ │ Tất cả: 3   │ Chờ: 2     │ Chọn: 1  │ Từ chối: 0  │          │
│ └─────────────┴────────────┴──────────┴─────────────┘          │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [Avatar] Gia sư A              [Chờ xét duyệt]             │ │
│ │           Ứng tuyển: 15/01/2025                            │ │
│ │                                                            │ │
│ │ "Xin chào, tôi là gia sư Toán với 5 năm kinh nghiệm..."  │ │
│ │                                                            │ │
│ │ [Chọn gia sư]  [Từ chối]                                  │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [Avatar] Gia sư B              [Chờ xét duyệt]             │ │
│ │           Ứng tuyển: 14/01/2025                            │ │
│ │                                                            │ │
│ │ "Tôi là gia sư chuyên luyện thi..."                       │ │
│ │                                                            │ │
│ │ [Chọn gia sư]  [Từ chối]                                  │ │
│ └────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│ Đăng ngày 12/01/2025        Xem chi tiết →                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Routes Mới

```
/student/my-requests    →    Danh sách bảng tin của học viên (MyStudentRequests)
```

---

## 📱 Menu Item Mới

Đã thêm menu item "Bảng tin của tôi" vào AccountLayout cho học viên:
```
✓ Trang cá nhân
✓ Bảng tin của tôi (NEW!)
✓ Lớp học của tôi
✓ Thời khóa biểu
✓ Tin nhắn
✓ Hỗ trợ
```

---

## 🎯 Các Tính Năng

### ✅ Hiển Thị Bảng Tin
- Danh sách tất cả bảng tin của học viên hiện tại
- Hiển thị status (Đang tìm / Đã match)
- Hiển thị thông tin liên hệ
- Hiển thị chi tiết lớp học

### ✅ Quản Lý Ứng Tuyển
- Xem tất cả ứng tuyển cho mỗi bảng tin
- Chấp nhận ứng tuyển từ gia sư
- Từ chối ứng tuyển
- Khi chọn 1 gia sư → các khác tự động bị từ chối
- Trạng thái ứng tuyển hiển thị rõ ràng

### ✅ Bộ Lọc & Sắp Xếp
- Lọc bảng tin theo trạng thái (Tất cả / Đang tìm / Đã match)
- Sắp xếp (Mới nhất / Cũ nhất)
- Làm mới dữ liệu

### ✅ Thống Kê
- Tổng số bảng tin
- Số bảng tin đang tìm
- Số bảng tin đã match
- Tổng ứng tuyển
- Ứng tuyển chờ xét duyệt

### ✅ Trạng Thái Dữ Liệu
- Loading state khi fetch dữ liệu
- Thông báo khi không có bảng tin
- Toast notifications cho tất cả action
- Error handling

---

## 🔄 Luồng Dữ Liệu

```
1. Người dùng vào /student/my-requests
   ↓
2. Component gọi getMyStudentRequests()
   ↓
3. Backend trả về danh sách bảng tin + ứng tuyển
   ↓
4. Hiển thị các thẻ bảng tin
   ↓
5. Học viên có thể:
   - Lọc/sắp xếp
   - Expand danh sách ứng tuyển
   - Chấp nhận/từ chối ứng tuyển
   ↓
6. Khi quản lý ứng tuyển:
   - Gọi acceptApplication() hoặc rejectApplication()
   - Cập nhật UI
   - Fetch lại dữ liệu (optional)
```

---

## 📡 API Endpoints Cần Có

Backend cần hỗ trợ:

```
GET /api/student-requests/my-requests
Response: StudentRequestsWithApplications[]
{
  id: number,
  contactName: string,
  phone: string,
  address: string,
  subjectTags: string,
  gradeLevel: string,
  studyTimeTags: string,
  teachingMode: string,
  sessionsPerWeek: number,
  budget: number,
  requirements: string,
  createdAt: string,
  userId: number,
  status: string,
  applications: [
    {
      id: number,
      tutorId: number,
      tutorName: string,
      tutorAvatar: string,
      introduction: string,
      status: 'PENDING' | 'ACCEPTED' | 'REJECTED',
      createdAt: string
    }
  ],
  totalApplications: number,
  pendingApplications: number,
  acceptedApplications: number,
  rejectedApplications: number
}
```

---

## 🎨 Styling

- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Tailwind CSS
- ✅ Color-coded status (Yellow=Pending, Green=Accepted, Red=Rejected)
- ✅ Icons từ Font Awesome
- ✅ Loading indicators
- ✅ Smooth transitions

---

## ✅ Checklist

- [x] API file tạo xong
- [x] Component card tạo xong
- [x] Page tạo xong
- [x] Route thêm vào App.tsx
- [x] Menu item thêm vào AccountLayout
- [x] No TypeScript errors
- [x] No unused imports
- [x] Responsive design
- [x] Toast notifications
- [x] Error handling
- [x] Loading states
- [x] Empty state UI

---

## 🚀 Cách Sử Dụng

1. **Đăng nhập** với tài khoản học viên
2. **Vào menu** → "Bảng tin của tôi"
3. **Xem danh sách** các bảng tin đã đăng
4. **Lọc/sắp xếp** theo ý muốn
5. **Expand** danh sách ứng tuyển
6. **Chấp nhận hoặc từ chối** ứng tuyển từ gia sư

---

## 💡 Tính Năng Có Thể Mở Rộng

- [ ] Export danh sách ứng tuyển
- [ ] Gửi email thông báo
- [ ] Thêm ghi chú cho mỗi ứng tuyển
- [ ] Xem lịch sử các ứng tuyển từ trước
- [ ] Rating/feedback cho gia sư
- [ ] Statistics chi tiết

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra console browser
2. Kiểm tra Network tab
3. Kiểm tra backend logs
4. Đảm bảo API endpoint có sẵn

**Status:** COMPLETED ✅
