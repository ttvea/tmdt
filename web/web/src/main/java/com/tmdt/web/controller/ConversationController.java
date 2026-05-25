package com.tmdt.web.controller;

import com.tmdt.web.dto.request.CreateConversationRequest;
import com.tmdt.web.entity.Conversation;
import com.tmdt.web.repository.UserRep;
import org.springframework.security.core.userdetails.User;
import com.tmdt.web.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final UserRep userRep;
    @PostMapping
    public ResponseEntity<?> createConversation(
            @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal User springUser
    ) {
        String email = springUser.getUsername();

        com.tmdt.web.entity.User user = userRep.findByEmail(email)
                .orElseThrow();

        Integer studentId = user.getId();

        Conversation conversation =
                conversationService.createOrGetConversation(
                        studentId,
                        request.getTutorId()
                );

        return ResponseEntity.ok(conversation.getId());
    }

    @GetMapping
    public ResponseEntity<?> getMyConversations(

            @AuthenticationPrincipal
            org.springframework.security.core.userdetails.User springUser
    ) {

        String email = springUser.getUsername();

        com.tmdt.web.entity.User user = userRep
                .findByEmail(email)
                .orElseThrow();

        return ResponseEntity.ok(
                conversationService.getUserConversations(
                        user.getId()
                )
        );
    }
}
