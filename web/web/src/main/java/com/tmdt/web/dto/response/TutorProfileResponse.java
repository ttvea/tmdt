package com.tmdt.web.dto.response;
import lombok.Data;

@Data
public class TutorProfileResponse {
    private int userId;
    private String fullName;
    private String email;
    private String phone;
    private String avatar;
    private String gender;
    private Integer birthday;
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
    private String certificateUrl;
    private Boolean isVerified;
}