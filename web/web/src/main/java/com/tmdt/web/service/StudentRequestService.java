package com.tmdt.web.service;

import com.tmdt.web.dto.request.StudentRequestCreate;
import com.tmdt.web.dto.response.StudentRequestResponse;
import com.tmdt.web.entity.StudentRequest;
import com.tmdt.web.repository.GradeLevelRep;
import com.tmdt.web.repository.StudentRequestRep;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentRequestService {

    private final StudentRequestRep studentRequestRep;
    private final UserRep userRep;
    private final GradeLevelRep gradeLevelRep;

    @Transactional
    public void createRequest(Long userId, StudentRequestCreate dto) {
        StudentRequest request = new StudentRequest();

        request.setUser(userRep.findById(userId.intValue()).orElseThrow(() -> new RuntimeException("User not found")));
        request.setContactName(dto.getName());
        request.setContactPhone(dto.getPhone());
        request.setAddress(dto.getArea());

        if (dto.getClassLevelId() != null) {
            request.setGradeLevel(gradeLevelRep.findById(dto.getClassLevelId().intValue()).orElse(null));
        }

        request.setSubjectTags(dto.getSubjects());
        request.setStudyTimeTags(dto.getStudyTimes());
        request.setTeachingMode(dto.getTeachingMode());
        request.setSessionsPerWeek(dto.getSessionsPerWeek());
        request.setBudget(dto.getBudget());
        request.setRequirements(dto.getRequirements());
        request.setStatus("PENDING");

        studentRequestRep.save(request);
    }

    public List<StudentRequestResponse> getAllOpenRequests() {
        return studentRequestRep.findAll().stream()
                .map(StudentRequestResponse::new)
                .collect(Collectors.toList());
    }
}