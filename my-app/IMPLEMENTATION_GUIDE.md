# Hướng Dẫn Tính Năng Ứng Tuyển Lớp Học

## 📋 Tổng Quan

Đã triển khai hoàn chỉnh tính năng ứng tuyển cho gia sư vào các bảng tin lớp học của học viên. Hệ thống bao gồm:

1. **API Client** - Gọi các endpoint backend
2. **Giao Diện Ứng Tuyển** - Modal và form cho gia sư
3. **Danh Sách Ứng Tuyển** - Xem và quản lý ứng tuyển
4. **Trang Chi Tiết** - Xem toàn bộ thông tin bảng tin
5. **Quản Lý Ứng Tuyển** - Dành riêng cho gia sư

---

## 🔧 Các File Được Tạo/Cập Nhật

### 1. **API Client** - `src/api/applications.ts`
```typescript
- applyToStudentRequest() - Ứng tuyển vào bảng tin
- getApplicationsByRequest() - Lấy ứng tuyển của một bảng tin (dành cho học viên)
- getMyApplications() - Lấy ứng tuyển của gia sư (dành cho gia sư)
- acceptApplication() - Chấp nhận ứng tuyển
- rejectApplication() - Từ chối ứng tuyển
```

### 2. **Giao Diện Modal** - `src/components/ApplicationModal.tsx`
- Cho phép gia sư nhập thư giới thiệu
- Validation: tối thiểu 20 ký tự
- Hiển thị số ký tự đã nhập
- Loading state khi gửi

### 3. **Danh Sách Ứng Tuyển** - `src/components/ApplicationsList.tsx`
- Hiển thị tất cả ứng tuyển cho một bảng tin
- Hiển thị thông tin gia sư (tên, avatar)
- Nút chấp nhận/từ chối cho học viên (chủ bảng tin)
- Hiển thị trạng thái ứng tuyển (PENDING, ACCEPTED, REJECTED)

### 4. **Danh Sách Ứng Tuyển Của Gia Sư** - `src/components/TutorApplicationsList.tsx`
- Hiển thị tất cả ứng tuyển của gia sư
- Bộ lọc theo trạng thái (Tất cả, Chờ xét duyệt, Đã chọn, Bị từ chối)
- Thống kê số lượng theo trạng thái
- Khả năng lọc nhanh bằng cách click trên thẻ thống kê

### 5. **Trang Chi Tiết Bảng Tin** - `src/pages/Student/StudentRequestDetail.tsx`
- Hiển thị chi tiết đầy đủ của bảng tin
- Nút "Ứng tuyển ngay" cho gia sư
- Danh sách ứng tuyển cho chủ bảng tin
- Thông tin liên hệ, chi tiết lớp học, yêu cầu khác
- Hiển thị học phí dự kiến

### 6. **Trang Ứng Tuyển Của Gia Sư** - `src/pages/Tutor/applications.tsx`
- Sử dụng `AccountLayout` để duy trì giao diện nhất quán
- Hiển thị `TutorApplicationsList`
- Bảo vệ: chỉ gia sư có thể truy cập

### 7. **Danh Sách Bảng Tin Cập Nhật** - `src/pages/Student/StudentRequestsList.tsx`
- Thêm nút "Ứng tuyển" trên mỗi thẻ bảng tin
- Tích hợp `ApplicationModal`
- Kiểm tra quyền: chỉ gia sư có thể ứng tuyển
- Yêu cầu đăng nhập nếu chưa đăng nhập

### 8. **Cập Nhật Routing** - `src/App.tsx`
- Thêm route `/discover/student-requests/:requestId` → `StudentRequestDetail`
- Thêm route `/tutor/applications` → `TutorApplications`

### 9. **Cập Nhật Menu** - `src/components/AccountLayout.tsx`
- Thêm menu item "Ứng tuyển" (`/tutor/applications`) cho gia sư

---

## 🎯 Luồng Công Việc

### 📌 Cho Gia Sư (Ứng Tuyển)

1. **Bước 1**: Gia sư xem bảng tin lớp học
   - URL: `/discover/student-requests`
   - Nhấn nút "Ứng tuyển" trên bảng tin

2. **Bước 2**: Nhập thư giới thiệu
   - Modal hiện lên
   - Nhập giới thiệu bản thân (tối thiểu 20 ký tự)
   - Nhấn "Ứng tuyển"

3. **Bước 3**: Xem ứng tuyển của mình
   - URL: `/tutor/applications`
   - Lọc theo trạng thái: Chờ xét duyệt, Đã chọn, Bị từ chối
   - Xem chi tiết ứng tuyển

### 📌 Cho Học Viên (Chủ Bảng Tin)

1. **Bước 1**: Xem bảng tin chi tiết
   - URL: `/discover/student-requests/:id`
   - Xem tất cả thông tin bảng tin

2. **Bước 2**: Xem danh sách ứng tuyển
   - Scroll xuống phần "Danh sách ứng tuyển"
   - Xem thông tin gia sư, thư giới thiệu

3. **Bước 3**: Quản lý ứng tuyển
   - Nhấn "Chọn gia sư" để chấp nhận
   - Nhấn "Từ chối" để từ chối
   - Khi chọn, tất cả ứng tuyển khác sẽ tự động bị từ chối

---

## 🎨 Giao Diện

### Danh Sách Bảng Tin
- Thẻ bảng tin với nút "Ứng tuyển"
- Hiển thị giá cạnh bên phải nút
- Loading state khi gọi API

### Modal Ứng Tuyển
- Tiêu đề: "Ứng tuyển"
- Textarea để nhập thư giới thiệu
- Hiển thị số ký tự: "Hiện tại: X ký tự"
- Nút "Hủy" và "Ứng tuyển" với loading state

### Trang Chi Tiết Bảng Tin
- Tiêu đề với tên môn học
- Thẻ thông tin liên hệ (tên, số điện thoại, địa chỉ)
- Thẻ chi tiết lớp học (môn, lớp, thời gian, học phí)
- Thẻ yêu cầu khác
- Thẻ hiển thị học phí (bên phải)
- Danh sách ứng tuyển (chỉ cho chủ bảng tin)

### Trang Ứng Tuyển Gia Sư
- 4 thẻ thống kê: Tất cả, Chờ xét duyệt, Đã chọn, Bị từ chối
- Danh sách ứng tuyển với trạng thái màu khác nhau
- Hiển thị ảnh đại diện, tên, ngày ứng tuyển

---

## ✅ Trạng Thái Ứng Tuyển

| Trạng Thái | Màu | Ý Nghĩa |
|-----------|-----|--------|
| PENDING | Vàng | Chờ xét duyệt |
| ACCEPTED | Xanh | Đã được chọn |
| REJECTED | Đỏ | Bị từ chối |

---

## 🔐 Kiểm Soát Quyền Truy Cập

### Trang `/discover/student-requests/:id`
- Mọi người có thể xem
- Chỉ gia sư mới thấy nút "Ứng tuyển"
- Chủ bảng tin thấy danh sách ứng tuyển

### Trang `/tutor/applications`
- Chỉ gia sư có quyền truy cập
- Hiển thị lỗi nếu không phải gia sư

---

## 📡 API Backend Được Sử Dụng

```
POST   /api/applications              - Ứng tuyển
GET    /api/applications/request/{id} - Lấy ứng tuyển của bảng tin
GET    /api/applications/my-applications - Lấy ứng tuyển của gia sư
PUT    /api/applications/{id}/accept  - Chấp nhận ứng tuyển
PUT    /api/applications/{id}/reject  - Từ chối ứng tuyển
```

---

## 🚀 Cách Sử Dụng

### 1. Import Components
```typescript
import { ApplicationModal } from '../../components/ApplicationModal'
import { ApplicationsList } from '../../components/ApplicationsList'
import { TutorApplicationsList } from '../../components/TutorApplicationsList'
import { StudentRequestDetail } from '../../pages/Student/StudentRequestDetail'
import { TutorApplications } from '../../pages/Tutor/applications'
```

### 2. Sử Dụng ApplicationModal
```typescript
const [showModal, setShowModal] = useState(false)
const [requestId, setRequestId] = useState<number | null>(null)

<ApplicationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  requestId={requestId!}
  onSuccess={() => {
    // Handle success
  }}
/>
```

### 3. Sử Dụng ApplicationsList
```typescript
<ApplicationsList 
  requestId={requestId}
  currentUserId={userId}
/>
```

### 4. Sử Dụng TutorApplicationsList
```typescript
<TutorApplicationsList />
```

---

## 💡 Tính Năng Nổi Bật

✅ Modal ứng tuyển với validation\
✅ Danh sách ứng tuyển với trạng thái\
✅ Quản lý ứng tuyển (chấp nhận/từ chối)\
✅ Lọc ứng tuyển theo trạng thái\
✅ Thống kê ứng tuyển\
✅ Giao diện responsive\
✅ Loading states\
✅ Toast notifications\
✅ Kiểm soát quyền truy cập\
✅ Trang chi tiết bảng tin\

---

## 📝 Ghi Chú

- Tất cả thông báo sử dụng `react-toastify`
- API calls sử dụng axios interceptors để tự động gắn token
- Validation được thực hiện cả ở client và server
- Giao diện sử dụng Tailwind CSS
- Hỗ trợ responsive design
