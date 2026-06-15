package com.tmdt.web.service;

import com.tmdt.web.repository.ApplicationRep;
import com.tmdt.web.dto.request.ApplyRequest;
import com.tmdt.web.dto.response.ApplicationResponse;
import com.tmdt.web.entity.Application;
import com.tmdt.web.entity.StudentRequest;
import com.tmdt.web.entity.User;
import com.tmdt.web.enums.ApplicationStatus;
import com.tmdt.web.repository.StudentRequestRep;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final StudentRequestRep studentRequestRep;
    private final ApplicationRep applicationRep;
    private final UserRep userRep;

    @Transactional
    public Application apply(
            Integer tutorId,
            ApplyRequest dto
    ) {

        StudentRequest request =
                studentRequestRep.findById(
                        dto.getStudentRequestId()
                ).orElseThrow();

        if (applicationRep
                .existsByStudentRequestIdAndTutorId(
                        request.getId(),
                        tutorId
                )) {

            throw new RuntimeException(
                    "Bạn đã ứng tuyển tin này"
            );
        }

        User tutor =
                userRep.findById(tutorId)
                        .orElseThrow();

        Application application =
                Application.builder()
                        .studentRequest(request)
                        .tutor(tutor)
                        .introduction(dto.getIntroduction())
                        .status(ApplicationStatus.PENDING)
                        .build();

        return applicationRep.save(application);
    }

    public List<ApplicationResponse> getApplicationsOfStudent(
            Integer studentId
    ) {

        return applicationRep
                .findByStudentRequestUserId(studentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ApplicationResponse> getApplicationsByTutor(
            Integer tutorId
    ) {

        return applicationRep
                .findByTutorId(tutorId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void acceptApplication(
            Long applicationId,
            Integer currentUserId
    ) {

        Application selected =
                applicationRep.findById(applicationId)
                        .orElseThrow();

        StudentRequest request =
                selected.getStudentRequest();

        // chỉ chủ tin mới được chọn
        if (!request.getUser()
                .getId()
                .equals(currentUserId)) {

            throw new RuntimeException(
                    "Bạn không có quyền chọn gia sư"
            );
        }

        selected.setStatus(
                ApplicationStatus.ACCEPTED
        );


        List<Application> applications =
                applicationRep.findByStudentRequestId(
                        request.getId()
                );

        for (Application app : applications) {

            if (!app.getId().equals(applicationId)) {

                app.setStatus(
                        ApplicationStatus.REJECTED
                );
            }
        }

        request.setStatus("MATCHED");

        User selectedTutor = selected.getTutor();
        request.setSelectedTutor(selectedTutor);
        applicationRep.saveAll(applications);
        studentRequestRep.save(request);
    }

    @Transactional
    public void rejectApplication(
            Long applicationId,
            Integer currentUserId
    ) {

        Application application =
                applicationRep.findById(applicationId)
                        .orElseThrow();

        StudentRequest request =
                application.getStudentRequest();

        if (!request.getUser()
                .getId()
                .equals(currentUserId)) {

            throw new RuntimeException(
                    "Bạn không có quyền từ chối"
            );
        }

        application.setStatus(
                ApplicationStatus.REJECTED
        );

        applicationRep.save(application);
    }

    private ApplicationResponse toResponse(
            Application application
    ) {

        return ApplicationResponse.builder()
                .id(application.getId())
                .studentRequestId(application.getStudentRequest().getId())
                .tutorId(
                        application.getTutor().getId()
                )
                .studentUserId(
                        application.getStudentRequest().getUser().getId()
                )
                .studentName(
                        application.getStudentRequest().getUser().getFullName()
                )
                .studentAvatar(
                        application.getStudentRequest().getUser().getAvatar()
                )
                .tutorName(
                        application.getTutor().getFullName()
                )
                .tutorAvatar(
                        application.getTutor().getAvatar()
                )
                .introduction(
                        application.getIntroduction()
                )
                .status(
                        application.getStatus()
                )
                .createdAt(
                        application.getCreatedAt()
                )
                .build();
    }
}
