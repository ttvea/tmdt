package com.tmdt.web.dto.response;

import com.tmdt.web.entity.Subject;
import com.tmdt.web.entity.TutorProfile;
import com.tmdt.web.entity.User;

import java.util.List;

public record AdminTutorResponse(
        Integer id,
        Integer userId,
        Integer profileId,
        String fullName,
        String email,
        String avatar,
        String major,
        String experience,
        Boolean isVerified,
        Boolean enabled,
        Boolean hasProfile,
        List<String> subjects
) {
    public static AdminTutorResponse from(User user, TutorProfile profile) {
        List<String> subjectNames = profile != null && profile.getSubjects() != null
                ? profile.getSubjects().stream().map(Subject::getName).toList()
                : List.of();

        return new AdminTutorResponse(
                profile != null ? profile.getId() : user.getId(),
                user.getId(),
                profile != null ? profile.getId() : null,
                user.getFullName(),
                user.getEmail(),
                user.getAvatar(),
                profile != null ? profile.getMajor() : null,
                profile != null ? profile.getExperience() : null,
                profile != null ? profile.getIsVerified() : false,
                user.getEnabled(),
                profile != null,
                subjectNames
        );
    }
}
