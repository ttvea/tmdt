package com.tmdt.web.controller;

import com.tmdt.web.dto.request.ApplyRequest;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final UserRep userRep;

    @PostMapping
    public ResponseEntity<?> apply(
            @RequestBody ApplyRequest request,
            @AuthenticationPrincipal User springUser
    ) {

        String email = springUser.getUsername();

        com.tmdt.web.entity.User user =
                userRep.findByEmail(email)
                        .orElseThrow();

        return ResponseEntity.ok(
                applicationService.apply(
                        user.getId(),
                        request
                )
        );
    }

    @GetMapping("/received")
    public ResponseEntity<?> getReceivedApplications(
            @AuthenticationPrincipal User springUser
    ) {

        String email = springUser.getUsername();

        com.tmdt.web.entity.User user =
                userRep.findByEmail(email)
                        .orElseThrow();

        return ResponseEntity.ok(
                applicationService.getApplicationsOfStudent(
                        user.getId()
                )
        );
    }

    @GetMapping("/my-applications")
    public ResponseEntity<?> getMyApplications(
            @AuthenticationPrincipal User springUser
    ) {

        String email = springUser.getUsername();

        com.tmdt.web.entity.User user =
                userRep.findByEmail(email)
                        .orElseThrow();

        return ResponseEntity.ok(
                applicationService.getApplicationsByTutor(
                        user.getId()
                )
        );
    }

    @PutMapping("/{applicationId}/accept")
    public ResponseEntity<?> acceptApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal User springUser
    ) {

        String email = springUser.getUsername();

        com.tmdt.web.entity.User user =
                userRep.findByEmail(email)
                        .orElseThrow();

        applicationService.acceptApplication(
                applicationId,
                user.getId()
        );

        return ResponseEntity.ok(
                "Đã chọn gia sư"
        );
    }

    @PutMapping("/{applicationId}/reject")
    public ResponseEntity<?> rejectApplication(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal User springUser
    ) {

        String email = springUser.getUsername();

        com.tmdt.web.entity.User user =
                userRep.findByEmail(email)
                        .orElseThrow();

        applicationService.rejectApplication(
                applicationId,
                user.getId()
        );

        return ResponseEntity.ok(
                "Đã từ chối ứng tuyển"
        );
    }
}