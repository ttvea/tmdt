package com.tmdt.web.dto.request;

import lombok.Data;

@Data
public class CreateConversationRequest {

    private Integer tutorId;
    private Integer studentId;
}