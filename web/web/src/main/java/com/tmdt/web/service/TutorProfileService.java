package com.tmdt.web.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.tmdt.web.dto.request.TutorProfileRequest;
import com.tmdt.web.dto.response.TutorProfileResponse;
import com.tmdt.web.dto.response.TutorSearchResponse;
import com.tmdt.web.entity.Subject;
import com.tmdt.web.entity.TutorProfile;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.SubjectRep;
import com.tmdt.web.repository.TutorProfileRep;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TutorProfileService {

    private final TutorProfileRep tutorProfileRep;
    private final UserRep userRep;
    private final SubjectRep subjectRep;
    private final Cloudinary cloudinary;

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
                profile.getOccupationType() != null ? profile.getOccupationType().name() : null);
        req.setUniversity(profile.getUniversity());
        req.setStudentYear(profile.getStudentYear());
        req.setMajor(profile.getMajor());
        req.setSchoolName(profile.getSchoolName());
        req.setTeachMajor(profile.getTeachMajor());
        req.setGraduatedSchool(profile.getGraduatedSchool());
        req.setGraduatedYear(profile.getGraduatedYear());
        req.setExperience(profile.getExperience());
        req.setBio(profile.getBio());

        if (profile.getSubjects() != null) {
            List<Integer> ids = profile.getSubjects().stream()
                    .map(Subject::getId)
                    .collect(Collectors.toList());
            req.setSubjectIds(ids);
        }
        return req;
    }

    public TutorProfileResponse saveProfile(int userId, TutorProfileRequest request) {
        User user = userRep.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        if (request.getFullName() != null && !request.getFullName().isBlank())
            user.setFullName(request.getFullName());
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getBirthday() != null)
            user.setBirthday(request.getBirthday());
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
                        ? TutorProfile.OccupationType.valueOf(request.getOccupationType()) : null);
        profile.setUniversity(request.getUniversity());
        profile.setStudentYear(request.getStudentYear());
        profile.setMajor(request.getMajor());
        profile.setSchoolName(request.getSchoolName());
        profile.setTeachMajor(request.getTeachMajor());
        profile.setGraduatedSchool(request.getGraduatedSchool());
        profile.setGraduatedYear(request.getGraduatedYear());
        profile.setExperience(request.getExperience());
        profile.setBio(request.getBio());

        if (request.getSubjectIds() != null && !request.getSubjectIds().isEmpty()) {
            List<Subject> subjects = subjectRep.findAllById(request.getSubjectIds());
            profile.setSubjects(subjects);
        } else {
            profile.setSubjects(new ArrayList<>());
        }

        tutorProfileRep.save(profile);
        return mapToResponse(user, profile);
    }

    @SuppressWarnings("unchecked")
    public String uploadAvatar(int userId, MultipartFile file) throws IOException {
        User user = userRep.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        Map<String, Object> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "edumatch/avatars",
                        "public_id", "user_" + userId,
                        "overwrite", true,
                        "resource_type", "image"
                )
        );

        String url = (String) result.get("secure_url");
        user.setAvatar(url);
        userRep.save(user);
        return url;
    }

    @SuppressWarnings("unchecked")
    public String uploadCertificate(int userId, MultipartFile file) throws IOException {
        TutorProfile profile = tutorProfileRep.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Chưa có profile, hãy điền thông tin trước"));

        Map<String, Object> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "edumatch/certificates",
                        "resource_type", "auto"
                )
        );

        String url = (String) result.get("secure_url");
        profile.setCertificateUrl(url);
        tutorProfileRep.save(profile);
        return url;
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
                profile.getOccupationType() != null ? profile.getOccupationType().name() : null);
        res.setUniversity(profile.getUniversity());
        res.setStudentYear(profile.getStudentYear());
        res.setMajor(profile.getMajor());
        res.setSchoolName(profile.getSchoolName());
        res.setTeachMajor(profile.getTeachMajor());
        res.setGraduatedSchool(profile.getGraduatedSchool());
        res.setGraduatedYear(profile.getGraduatedYear());
        res.setExperience(profile.getExperience());
        res.setBio(profile.getBio());
        res.setCertificateUrl(profile.getCertificateUrl());
        res.setIsVerified(profile.getIsVerified());

        if (profile.getSubjects() != null) {
            List<TutorProfileResponse.SubjectInfo> subjectInfos = profile.getSubjects().stream()
                    .map(s -> {
                        TutorProfileResponse.SubjectInfo info = new TutorProfileResponse.SubjectInfo();
                        info.setId(s.getId());
                        info.setName(s.getName());
                        info.setCategoryName(s.getCategory() != null ? s.getCategory().getName() : null);
                        return info;
                    })
                    .collect(Collectors.toList());
            res.setSubjects(subjectInfos);
        } else {
            res.setSubjects(new ArrayList<>());
        }

        return res;
    }
    public Page<TutorSearchResponse> searchTutors(
            String name,
            TutorProfile.OccupationType occupation,
            String experience,
            String subjectName,
            Pageable pageable
    ) {

        Page<TutorProfile> tutors = tutorProfileRep.searchTutors(
                name,
                occupation,
                experience,
                subjectName,
                pageable
        );

        return tutors.map(t -> {
            TutorSearchResponse dto = new TutorSearchResponse();

            dto.setId(t.getId());
            dto.setFullName(t.getUser().getFullName());
            dto.setAvatar(t.getUser().getAvatar());
            dto.setMajor(t.getMajor());
            dto.setExperience(t.getExperience());
            dto.setVerified(t.getIsVerified());
            dto.setSubjects(
                    t.getSubjects()
                            .stream()
                            .map(Subject::getName)
                            .toList()
            );

            return dto;
        });
    }
}
