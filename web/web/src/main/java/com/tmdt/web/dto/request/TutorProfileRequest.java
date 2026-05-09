package com.tmdt.web.dto.request;


import lombok.Data;

@Data
public class TutorProfileRequest {
    private String fullName;
    private String phone;
    private Integer birthday;
    private String gender;
    private String occupationType;
    private String university;
    private Integer studentYear;
    private String major;
    private String schoolName;
    private String teachMajor;
    private String graduatedSchool;
    private Integer graduatedYear;
    private String experience;
    private String subjects;
    private String bio;
}