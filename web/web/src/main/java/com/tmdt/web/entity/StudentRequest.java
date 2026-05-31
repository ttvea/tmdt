package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_requests")
@Data
public class StudentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "contact_name", nullable = false)
    private String contactName;

    @Column(name = "contact_phone", nullable = false)
    private String contactPhone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gradelevel_id")
    private GradeLevel gradeLevel;

    @Column(name = "subject_tags", columnDefinition = "TEXT")
    private String subjectTags;

    @Column(name = "study_time_tags", columnDefinition = "TEXT")
    private String studyTimeTags;

    @Column(name = "teaching_mode")
    private String teachingMode;

    @Column(name = "sessions_per_week")
    private Integer sessionsPerWeek;

    private BigDecimal budget;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    private String status = "PENDING";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}