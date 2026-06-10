# 🚀 Quick Start - Tính Năng Ứng Tuyển

## 📌 Các File Chính

| File | Mô Tả |
|------|-------|
| `src/api/applications.ts` | API Client để gọi backend |
| `src/components/ApplicationModal.tsx` | Modal ứng tuyển |
| `src/components/ApplicationsList.tsx` | Danh sách ứng tuyển (cho học viên) |
| `src/components/TutorApplicationsList.tsx` | Danh sách ứng tuyển (cho gia sư) |
| `src/pages/Student/StudentRequestDetail.tsx` | Trang chi tiết bảng tin |
| `src/pages/Tutor/applications.tsx` | Trang ứng tuyển của gia sư |
| `src/pages/Student/StudentRequestsList.tsx` | Danh sách bảng tin (cập nhật) |

---

## 🎯 Các Route Mới

```
/discover/student-requests/:id      → Chi tiết bảng tin (StudentRequestDetail)
/tutor/applications                 → Ứng tuyển của gia sư (TutorApplications)
```

---

## 🔧 Cách Tích Hợp

### 1. Gọi API Ứng Tuyển
```typescript
import { applyToStudentRequest } from '../api/applications'

const result = await applyToStudentRequest({
  studentRequestId: 123,
  introduction: "Xin chào, tôi là gia sư có 5 năm kinh nghiệm..."
})
```

### 2. Lấy Danh Sách Ứng Tuyển
```typescript
import { getApplicationsByRequest } from '../api/applications'

const apps = await getApplicationsByRequest(requestId)
// Trả về: ApplicationResponse[]
```

### 3. Lấy Ứng Tuyển Của Gia Sư
```typescript
import { getMyApplications } from '../api/applications'

const myApps = await getMyApplications()
```

### 4. Quản Lý Ứng Tuyển
```typescript
import { acceptApplication, rejectApplication } from '../api/applications'

// Chấp nhận
await acceptApplication(applicationId)

// Từ chối
await rejectApplication(applicationId)
```

---

## 📦 Type Definitions

```typescript
interface ApplicationResponse {
  id: number
  tutorId: number
  tutorName: string
  tutorAvatar: string
  introduction: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

interface ApplyRequest {
  studentRequestId: number
  introduction: string
}
```

---

## 🎨 UI Components

### ApplicationModal
```tsx
import { ApplicationModal } from '../../components/ApplicationModal'

<ApplicationModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  requestId={123}
  onSuccess={() => console.log('Applied!')}
/>
```

### ApplicationsList
```tsx
import { ApplicationsList } from '../../components/ApplicationsList'

<ApplicationsList 
  requestId={123}
  currentUserId={456}
/>
```

### TutorApplicationsList
```tsx
import { TutorApplicationsList } from '../../components/TutorApplicationsList'

<TutorApplicationsList />
```

---

## ✅ Danh Sách Kiểm Tra

- [x] API client được tạo
- [x] Modal ứng tuyển hoạt động
- [x] Danh sách ứng tuyển hiển thị
- [x] Quản lý ứng tuyển (chấp nhận/từ chối)
- [x] Trang chi tiết bảng tin
- [x] Trang ứng tuyển gia sư
- [x] Routes được thêm vào
- [x] Menu được cập nhật
- [x] Kiểm soát quyền truy cập
- [x] Toastify notifications
- [x] Loading states
- [x] Responsive design
- [x] Validation

---

## 🐛 Troubleshooting

### Modal không hiện lên?
- Kiểm tra `showApplicationModal` state
- Đảm bảo `requestId` không null
- Kiểm tra console cho lỗi

### Ứng tuyển không gửi đi?
- Kiểm tra token trong localStorage
- Kiểm tra kết nối backend
- Xem Network tab trong DevTools

### Danh sách ứng tuyển trống?
- Kiểm tra `requestId` có tồn tại
- Kiểm tra backend có trả về dữ liệu
- Kiểm tra API call trong Network tab

### Không thể chấp nhận ứng tuyển?
- Kiểm tra bạn là chủ bảng tin
- Kiểm tra ứng tuyển ở status PENDING
- Kiểm tra token trong localStorage

---

## 📊 API Endpoints

### Ứng Tuyển
```
POST /api/applications
Body: {
  "studentRequestId": 123,
  "introduction": "..."
}
Response: Application
```

### Lấy Ứng Tuyển
```
GET /api/applications/request/:requestId
Response: ApplicationResponse[]

GET /api/applications/my-applications
Response: ApplicationResponse[]
```

### Quản Lý
```
PUT /api/applications/:applicationId/accept
Response: { message: "Đã chọn gia sư" }

PUT /api/applications/:applicationId/reject
Response: { message: "Đã từ chối ứng tuyển" }
```

---

## 🎯 Quy Trình Thử Nghiệm

### 1. Thử ứng tuyển (gia sư)
```
1. Đăng nhập với tài khoản gia sư
2. Vào /discover/student-requests
3. Nhấn nút "Ứng tuyển" trên bảng tin
4. Nhập thư giới thiệu (tối thiểu 20 ký tự)
5. Nhấn "Ứng tuyển"
6. Kiểm tra toast: "Ứng tuyển thành công!"
```

### 2. Xem ứng tuyển (gia sư)
```
1. Đi tới /tutor/applications
2. Xem danh sách ứng tuyển
3. Lọc theo trạng thái (click trên thẻ thống kê)
4. Xem chi tiết ứng tuyển (introduction)
```

### 3. Quản lý ứng tuyển (học viên)
```
1. Đăng nhập với tài khoản học viên
2. Vào /discover/student-requests/:id (bảng tin của bạn)
3. Scroll xuống xem danh sách ứng tuyển
4. Nhấn [Chọn gia sư] hoặc [Từ chối]
5. Kiểm tra status thay đổi
```

### 4. Xem chi tiết (công khai)
```
1. Vào /discover/student-requests/:id
2. Xem toàn bộ thông tin bảng tin
3. Xem thống kê học phí
```

---

## 💡 Lưu Ý

- ⚠️ Chỉ gia sư mới có thể ứng tuyển
- ⚠️ Một gia sư chỉ ứng tuyển được 1 lần cho mỗi bảng tin
- ⚠️ Khi chấp nhận ứng tuyển, tất cả khác sẽ bị từ chối
- ⚠️ Thư giới thiệu tối thiểu 20 ký tự
- ⚠️ Cần đăng nhập để ứng tuyển
- ⚠️ Chỉ chủ bảng tin mới có thể quản lý ứng tuyển

---

## 🔐 Token & Authentication

```typescript
// Token được tự động gắn từ localStorage
const token = localStorage.getItem('access_token')
// Axios interceptor sẽ tự động thêm vào header:
// Authorization: Bearer {token}
```

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra console cho lỗi
2. Kiểm tra Network tab
3. Kiểm tra backend logs
4. Xem file `IMPLEMENTATION_GUIDE.md` để hiểu chi tiết
5. Xem file `WORKFLOW_DIAGRAM.md` để hiểu quy trình

---

## 🎊 Hoàn Thành!

Tính năng ứng tuyển đã được triển khai đầy đủ với:
- ✅ Giao diện đẹp
- ✅ Chức năng hoàn thiện
- ✅ Kiểm soát quyền truy cập
- ✅ Xử lý lỗi
- ✅ Thông báo người dùng
- ✅ Loading states
- ✅ Responsive design

**Sẵn sàng sử dụng!** 🚀
