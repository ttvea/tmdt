package com.tmdt.web.service;

import com.tmdt.web.dto.request.TutorProfileRequest;
import com.tmdt.web.dto.response.TutorProfileResponse;
import com.tmdt.web.entity.TutorProfile;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.TutorProfileRep;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TutorProfileService {

    private final TutorProfileRep tutorProfileRep;
    private final UserRep userRep;

    private static final String UPLOAD_DIR = "uploads/";

    public TutorProfileResponse getProfile(int userId) {
        User user = userRep.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        TutorProfile profile = tutorProfileRep.findByUserId(userId)
                .orElse(new TutorProfile());

        return mapToResponse(user, profile);
    }

    public TutorProfileRequest getProfileForEdit(int userId) {
        User user = userRep.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        TutorProfile profile = tutorProfileRep.findByUserId(userId)
                .orElse(new TutorProfile());

        TutorProfileRequest req = new TutorProfileRequest();

        req.setFullName(user.getFullName());
        req.setPhone(user.getPhone());
        req.setBirthday(user.getBirthday());
        req.setGender(user.getGender() != null ? user.getGender().name() : null);

        req.setOccupationType(
                profile.getOccupationType() != null ? profile.getOccupationType().name() : null
        );
        req.setUniversity(profile.getUniversity());
        req.setStudentYear(profile.getStudentYear());
        req.setMajor(profile.getMajor());
        req.setSchoolName(profile.getSchoolName());
        req.setTeachMajor(profile.getTeachMajor());
        req.setGraduatedSchool(profile.getGraduatedSchool());
        req.setGraduatedYear(profile.getGraduatedYear());
        req.setExperience(profile.getExperience());
        req.setSubjects(profile.getSubjects());
        req.setBio(profile.getBio());
        return req;
    }

    public TutorProfileResponse saveProfile(int userId, TutorProfileRequest request) {
        User user = userRep.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getBirthday() != null) {
            user.setBirthday(request.getBirthday());
        }
        if (request.getGender() != null && !request.getGender().isBlank()) {
            try {
                user.setGender(User.Gender.valueOf(request.getGender()));
            } catch (IllegalArgumentException ignored) {}
        }
        userRep.save(user);

        TutorProfile profile = tutorProfileRep.findByUserId(userId)
                .orElse(new TutorProfile());

        profile.setUser(user);
        profile.setOccupationType(
                request.getOccupationType() != null
                        ? TutorProfile.OccupationType.valueOf(request.getOccupationType())
                        : null
        );

        profile.setUniversity(request.getUniversity());
        profile.setStudentYear(request.getStudentYear());
        profile.setMajor(request.getMajor());
        profile.setSchoolName(request.getSchoolName());
        profile.setTeachMajor(request.getTeachMajor());
        profile.setGraduatedSchool(request.getGraduatedSchool());
        profile.setGraduatedYear(request.getGraduatedYear());
        profile.setExperience(request.getExperience());
        profile.setSubjects(request.getSubjects());
        profile.setBio(request.getBio());

        tutorProfileRep.save(profile);
        return mapToResponse(user, profile);
    }

    public String uploadAvatar(int userId, MultipartFile file) throws IOException {
        User user = userRep.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path path = Paths.get(UPLOAD_DIR + "avatars/" + fileName);
        Files.createDirectories(path.getParent());
        Files.write(path, file.getBytes());

        user.setAvatar("/uploads/avatars/" + fileName);
        userRep.save(user);
        return user.getAvatar();
    }

    public String uploadCertificate(int userId, MultipartFile file) throws IOException {
        TutorProfile profile = tutorProfileRep.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Chưa có profile, hãy điền thông tin trước"));

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path path = Paths.get(UPLOAD_DIR + "certificates/" + fileName);
        Files.createDirectories(path.getParent());
        Files.write(path, file.getBytes());

        profile.setCertificateUrl("/uploads/certificates/" + fileName);
        tutorProfileRep.save(profile);
        return profile.getCertificateUrl();
    }

    private TutorProfileResponse mapToResponse(User user, TutorProfile profile) {
        TutorProfileResponse res = new TutorProfileResponse();

        res.setUserId(user.getId());
        res.setFullName(user.getFullName());
        res.setEmail(user.getEmail());
        res.setPhone(user.getPhone());
        res.setAvatar(user.getAvatar());
        res.setBirthday(user.getBirthday());
        res.setGender(user.getGender() != null ? user.getGender().name() : null);
        res.setOccupationType(
                profile.getOccupationType() != null ? profile.getOccupationType().name() : null
        );
        res.setUniversity(profile.getUniversity());
        res.setStudentYear(profile.getStudentYear());
        res.setMajor(profile.getMajor());
        res.setSchoolName(profile.getSchoolName());
        res.setTeachMajor(profile.getTeachMajor());
        res.setGraduatedSchool(profile.getGraduatedSchool());
        res.setGraduatedYear(profile.getGraduatedYear());
        res.setExperience(profile.getExperience());
        res.setSubjects(profile.getSubjects());
        res.setBio(profile.getBio());
        res.setCertificateUrl(profile.getCertificateUrl());
        res.setIsVerified(profile.getIsVerified());

        return res;
    }
}