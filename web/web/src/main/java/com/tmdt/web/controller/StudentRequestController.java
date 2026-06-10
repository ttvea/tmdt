package com.tmdt.web.controller;

import com.tmdt.web.dto.request.StudentRequestCreate;
import com.tmdt.web.dto.response.ApiResponse;
import com.tmdt.web.dto.response.StudentRequestResponse;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.StudentRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student-requests")
@RequiredArgsConstructor
public class StudentRequestController {

    private final StudentRequestService studentRequestService;
    private final UserRep userRep; // Đã thêm UserRep để gọi xuống DB

    @PostMapping("/post")
    public ResponseEntity<ApiResponse<Object>> createStudentRequest(@RequestBody StudentRequestCreate request) {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            Long currentUserId = null;
            if ("anonymousUser".equals(principal)) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!", null));
            }
            if (principal instanceof User) {
                currentUserId = ((User) principal).getId().longValue();
            } else if (principal instanceof String) {
                String email = (String) principal;
                User user = userRep.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy user với email: " + email));
                currentUserId = user.getId().longValue();
            } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                String email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
                User user = userRep.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy user với email: " + email));
                currentUserId = user.getId().longValue();
            } else {
                throw new RuntimeException("Không nhận diện được định dạng người dùng: " + principal.getClass().getName());
            }
            studentRequestService.createRequest(currentUserId, request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Gửi yêu cầu tìm gia sư thành công!", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Lỗi từ Backend: " + e.getMessage(), null));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<StudentRequestResponse>>> getAllRequests() {
        List<StudentRequestResponse> data = studentRequestService.getAllOpenRequests();
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy danh sách thành công", data));
    }
    @GetMapping("/my-requests")
    public ResponseEntity<?> getMyRequests(
            @AuthenticationPrincipal UserDetails springUser
    ) {

        String email = springUser.getUsername();

        com.tmdt.web.entity.User user =
                userRep.findByEmail(email)
                        .orElseThrow();

        return ResponseEntity.ok(
                studentRequestService.getMyRequests(
                        user.getId()
                )
        );
    }
}