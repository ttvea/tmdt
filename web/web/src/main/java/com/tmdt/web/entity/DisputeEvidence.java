package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "dispute_evidences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "file_type", length = 80)
    private String fileType;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
