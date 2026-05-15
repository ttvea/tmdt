package com.tmdt.web.controller;

import com.tmdt.web.entity.GradeLevel;
import com.tmdt.web.repository.GradeLevelRep;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subject-level")
@RequiredArgsConstructor
public class GradeLevelController {

    private final GradeLevelRep levelRep;

    @GetMapping("/all")
    public List<GradeLevel> getAll() {
        return levelRep.findAll();
    }

    @PostMapping("/create")
    public GradeLevel create(@RequestParam String name) {
        GradeLevel level = GradeLevel.builder().name(name).build();
        return levelRep.save(level);
    }
}
