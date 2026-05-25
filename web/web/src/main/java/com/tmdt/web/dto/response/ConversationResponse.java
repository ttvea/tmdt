package com.tmdt.web.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConversationResponse {

    private Long conversationId;

    private Integer otherUserId;

    private String otherUserName;

    private String otherUserAvatar;

    private String lastMessage;

    private LocalDateTime lastMessageTime;
}