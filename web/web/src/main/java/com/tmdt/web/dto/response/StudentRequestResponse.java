package com.tmdt.web.dto.response;

import com.tmdt.web.entity.StudentRequest;
import lombok.Data;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Data
public class StudentRequestResponse {
    private Long id;
    private String contactName;
    private String address;
    private String subjectTags;
    private String gradeLevel;
    private String studyTimeTags;
    private String teachingMode;
    private Integer sessionsPerWeek;
    private BigDecimal budget;
    private String requirements;
    private String createdAt;

    public StudentRequestResponse(StudentRequest entity) {
        this.id = entity.getId();
        this.contactName = entity.getContactName();
        this.address = entity.getAddress();
        this.subjectTags = entity.getSubjectTags() != null ? entity.getSubjectTags() : "Đang cập nhật";
        this.gradeLevel = entity.getGradeLevel() != null ? entity.getGradeLevel().getName() : "Khác";
        this.studyTimeTags = entity.getStudyTimeTags() != null ? entity.getStudyTimeTags() : "Linh hoạt";
        this.teachingMode = entity.getTeachingMode();
        this.sessionsPerWeek = entity.getSessionsPerWeek();
        this.budget = entity.getBudget();
        this.requirements = entity.getRequirements();

        if (entity.getCreatedAt() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            this.createdAt = entity.getCreatedAt().format(formatter);
        }
    }
}