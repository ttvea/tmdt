package com.tmdt.web.entity;

import com.tmdt.web.enums.DisputePriority;
import com.tmdt.web.enums.DisputeResolutionType;
import com.tmdt.web.enums.DisputeStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "disputes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_code", nullable = false, unique = true, length = 32)
    private String caseCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private TutorClass tutorClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id")
    private User tutor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(nullable = false, length = 160)
    private String reason;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DisputeStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private DisputePriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution_type", nullable = false, length = 32)
    private DisputeResolutionType resolutionType;

    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_admin_id")
    private User resolvedByAdmin;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime resolvedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = DisputeStatus.PENDING;
        }
        if (priority == null) {
            priority = DisputePriority.NORMAL;
        }
        if (resolutionType == null) {
            resolutionType = DisputeResolutionType.NONE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
