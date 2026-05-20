package com.tmdt.web.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class TutorSearchResponse {
    private int id;
    private int userId;
    private String fullName;
    private String avatar;
    private String major;
    private String experience;
    private boolean isVerified;
    private List<String> subjects;
    public TutorSearchResponse(){}
}
