package com.tmdt.web.controller;

import com.tmdt.web.entity.Subject;
import com.tmdt.web.entity.GradeLevel;
import com.tmdt.web.repository.GradeLevelRep;
import com.tmdt.web.repository.SubjectRep;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subject-level")
@RequiredArgsConstructor
public class GradeLevelController {

    private final GradeLevelRep levelRep;

    @PostMapping("/create")
    public GradeLevel create(
            @RequestParam String name
    ) {
        GradeLevel level = GradeLevel.builder()
                .name(name)
                .build();

        return levelRep.save(level);
    }
}
