package com.tmdt.web.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class StudentRequestCreate {
    private String name;
    private String phone;
    private String area;
    private Long classLevelId;

    private String subjects;
    private String teachingMode;
    private Integer sessionsPerWeek;
    private String studyTimes;

    private BigDecimal budget;
    private String requirements;
}