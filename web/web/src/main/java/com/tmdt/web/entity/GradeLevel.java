package com.tmdt.web.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "grade_levels")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    @ManyToMany(mappedBy = "gradeLevels", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Subject> subjects;
}