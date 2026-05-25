package com.tmdt.web.dto.request;

import lombok.Data;

@Data
public class SendMessageRequest {

    private Long conversationId;
    private String content;
}