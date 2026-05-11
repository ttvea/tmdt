package com.tmdt.web.controller;


import com.tmdt.web.entity.Category;
import com.tmdt.web.repository.CategoryRep;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/category")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRep categoryRep;

    @PostMapping("/create")
    public Category create(
            @RequestParam String name,
            @RequestParam(required = false) String description
    ) {

        Category category = Category.builder()
                .name(name)
                .description(description)
                .build();

        return categoryRep.save(category);
    }
    @GetMapping("/all")
    public List<Category> getAllCategory(){
        return categoryRep.findAll();
    }
}