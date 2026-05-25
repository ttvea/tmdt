package com.tmdt.web.service;

import com.tmdt.web.dto.response.ConversationResponse;
import com.tmdt.web.entity.Conversation;
import com.tmdt.web.entity.Message;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.ConversationRep;
import com.tmdt.web.repository.MessageRep;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRep conversationRep;
    private final UserRep userRep;
    private final MessageRep messageRep;

    public Conversation createOrGetConversation(
            Integer studentId,
            Integer tutorId
    ) {

        User student = userRep.findById(studentId)
                .orElseThrow();

        User tutor = userRep.findById(tutorId)
                .orElseThrow();

        return conversationRep
                .findByStudentAndTutor(student, tutor)
                .orElseGet(() -> {

                    Conversation conversation =
                            Conversation.builder()
                                    .student(student)
                                    .tutor(tutor)
                                    .build();

                    return conversationRep.save(conversation);
                });
    }
    public List<ConversationResponse> getUserConversations(
            Integer userId
    ) {

        List<Conversation> conversations =
                conversationRep
                        .findByStudent_IdOrTutor_Id(
                                userId,
                                userId
                        );

        return conversations.stream()
                .map(conversation -> {

                    User otherUser;

                    if (conversation.getStudent().getId()
                            .equals(userId)) {

                        otherUser = conversation.getTutor();

                    } else {

                        otherUser = conversation.getStudent();
                    }


                    Message lastMessage =
                            messageRep
                                    .findTopByConversation_IdOrderByCreatedAtDesc(
                                            conversation.getId()
                                    );

                    ConversationResponse dto =
                            new ConversationResponse();

                    dto.setConversationId(
                            conversation.getId()
                    );

                    dto.setOtherUserId(
                            otherUser.getId()
                    );

                    dto.setOtherUserName(
                            otherUser.getFullName()
                    );

                    dto.setOtherUserAvatar(
                            otherUser.getAvatar()
                    );

                    if (lastMessage != null) {

                        dto.setLastMessage(
                                lastMessage.getContent()
                        );

                        dto.setLastMessageTime(
                                lastMessage.getCreatedAt()
                        );
                    }

                    return dto;
                })
                .toList();
    }
}