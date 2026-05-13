package com.tmdt.web.controller;

import com.tmdt.web.dto.SubjectRequest;
import com.tmdt.web.entity.Category;
import com.tmdt.web.entity.GradeLevel;
import com.tmdt.web.entity.Subject;
import com.tmdt.web.repository.CategoryRep;
import com.tmdt.web.repository.GradeLevelRep;
import com.tmdt.web.repository.SubjectRep;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subject")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectRep subjectRep;
    private final CategoryRep categoryRep;
    private final GradeLevelRep gradeLevelRep;

    @GetMapping("/all")
    public List<Subject> getAll() {
        return subjectRep.findAll();
    }

    @PostMapping("/create")
    public Subject create(@RequestBody SubjectRequest request) {

        Category category = categoryRep.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        List<GradeLevel> gradeLevels =
                gradeLevelRep.findAllById(request.getGradeLevelIds());

        Subject subject = Subject.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(category)
                .gradeLevels(gradeLevels)
                .build();

        return subjectRep.save(subject);
    }
}