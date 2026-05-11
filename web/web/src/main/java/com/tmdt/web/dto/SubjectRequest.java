package com.tmdt.web.dto;

import lombok.Data;

import java.util.List;

@Data
public class SubjectRequest {

    private String name;

    private String description;

    private Integer categoryId;

    private List<Integer> gradeLevelIds;
}