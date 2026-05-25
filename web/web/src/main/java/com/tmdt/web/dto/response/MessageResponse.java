package com.tmdt.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MessageResponse {

    private Long id;

    private String content;

    private String imageUrl;

    private Integer senderId;

    private Long conversationId;

    private LocalDateTime createdAt;
}