package com.tmdt.web.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

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
    @ToString.Exclude           // Cấm in user
    @EqualsAndHashCode.Exclude  // Cấm so sánh user
    @JsonIgnore
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

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "tutor_subjects",
        joinColumns = @JoinColumn(name = "tutor_profile_id"),
        inverseJoinColumns = @JoinColumn(name = "subject_id")
    )
    private List<Subject> subjects = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String bio;
    private String certificateUrl;
    private Boolean isVerified = false;
}