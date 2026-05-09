package com.tmdt.web.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tutor_profiles")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TutorProfile {

    public enum OccupationType {
        student, teacher, lecturer, worker
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;
    @Enumerated(EnumType.STRING)
    private OccupationType occupationType;
    private String university;
    private Integer studentYear;
    private String major;
    private String schoolName;
    private String teachMajor;
    private String graduatedSchool;
    private Integer graduatedYear;
    @Column(length = 50)
    private String experience;
    private String subjects;
    @Column(columnDefinition = "TEXT")
    private String bio;
    private String certificateUrl;
    private Boolean isVerified = false;
}