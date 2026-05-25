package com.tmdt.web.controller;

import com.tmdt.web.dto.request.SendMessageRequest;
import com.tmdt.web.dto.response.MessageResponse;
import com.tmdt.web.entity.Message;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final UserRep userRep;
    @PostMapping
    public ResponseEntity<?> sendMessage(
            @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal User springUser
    ) {
        String email = springUser.getUsername();

        com.tmdt.web.entity.User user = userRep.findByEmail(email)
                .orElseThrow();

        Integer senderId = user.getId();

        Message message =
                messageService.sendMessage(
                        senderId,
                        request
                );

        return ResponseEntity.ok(message.getId());
    }
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<?> getMessages(
            @PathVariable Long conversationId
    ) {
        return ResponseEntity.ok(
                messageService.getConversationMessages(
                        conversationId
                )
        );
    }
    @PostMapping("/image")
    public ResponseEntity<?> sendImageMessage(
            @RequestParam("conversationId") Long conversationId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User springUser
    ) throws IOException {
        String email = springUser.getUsername();

        com.tmdt.web.entity.User user = userRep.findByEmail(email)
                .orElseThrow();

        Message savedMessage =
                messageService.sendImageMessage(
                        conversationId,
                        user.getId(),
                        file
                );

        MessageResponse response =
                MessageResponse.builder()
                        .id(savedMessage.getId())
                        .content(savedMessage.getContent())
                        .imageUrl(savedMessage.getImageUrl())
                        .senderId(savedMessage.getSender().getId())
                        .conversationId(savedMessage.getConversation().getId())
                        .createdAt(savedMessage.getCreatedAt())
                        .build();

        return ResponseEntity.ok(response);

    }

}