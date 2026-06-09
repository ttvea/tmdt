package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "dispute_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String note;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
