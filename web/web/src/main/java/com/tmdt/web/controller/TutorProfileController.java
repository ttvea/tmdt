package com.tmdt.web.controller;

import com.tmdt.web.dto.request.TutorProfileRequest;
import com.tmdt.web.dto.response.TutorProfileResponse;
import com.tmdt.web.service.TutorProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/tutor-profile")
@RequiredArgsConstructor
public class TutorProfileController {

    private final TutorProfileService tutorProfileService;

    @GetMapping("/{userId}")
    public ResponseEntity<TutorProfileResponse> getProfile(@PathVariable int userId) {
        return ResponseEntity.ok(tutorProfileService.getProfile(userId));
    }
    @GetMapping("/{userId}/edit")
    public ResponseEntity<TutorProfileRequest> getProfileForEdit(@PathVariable int userId) {
        return ResponseEntity.ok(tutorProfileService.getProfileForEdit(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<TutorProfileResponse> saveProfile(
            @PathVariable int userId,
            @RequestBody TutorProfileRequest request) {
        return ResponseEntity.ok(tutorProfileService.saveProfile(userId, request));
    }

    @PostMapping("/{userId}/avatar")
    public ResponseEntity<String> uploadAvatar(
            @PathVariable int userId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(tutorProfileService.uploadAvatar(userId, file));
    }

    @PostMapping("/{userId}/certificate")
    public ResponseEntity<String> uploadCertificate(
            @PathVariable int userId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(tutorProfileService.uploadCertificate(userId, file));
    }
}
