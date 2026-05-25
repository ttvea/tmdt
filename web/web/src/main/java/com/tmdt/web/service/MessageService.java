package com.tmdt.web.service;

import com.cloudinary.Cloudinary;
import com.tmdt.web.dto.request.SendMessageRequest;
import com.tmdt.web.dto.response.MessageResponse;
import com.tmdt.web.entity.Conversation;
import com.tmdt.web.entity.Message;
import com.tmdt.web.entity.User;
import com.tmdt.web.repository.ConversationRep;
import com.tmdt.web.repository.MessageRep;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRep messageRep;
    private final ConversationRep conversationRep;
    private final UserRep userRep;
    private final Cloudinary cloudinary;
    public Message sendMessage(
            Integer senderId,
            SendMessageRequest request
    ) {

        User sender = userRep.findById(senderId)
                .orElseThrow();

        Conversation conversation =
                conversationRep.findById(
                        request.getConversationId()
                ).orElseThrow();

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getContent())
                .build();

        return messageRep.save(message);
    }
    public List<MessageResponse> getConversationMessages(
            Long conversationId
    ) {

        List<Message> messages =
                messageRep
                        .findByConversation_IdOrderByCreatedAtAsc(
                                conversationId
                        );

        return messages.stream()
                .map(message -> {

                    MessageResponse dto =
                            new MessageResponse();

                    dto.setId(message.getId());

                    dto.setContent(
                            message.getContent()
                    );

                    dto.setCreatedAt(
                            message.getCreatedAt()
                    );

                    dto.setSenderId(
                            message.getSender().getId()
                    );
                    dto.setImageUrl(message.getImageUrl());
                    dto.setCreatedAt(message.getCreatedAt());


                    return dto;
                })
                .toList();
    }
    public Message sendImageMessage(
            Long conversationId,
            Integer senderId,
            MultipartFile file
    ) throws IOException {

        Conversation conversation =
                conversationRep.findById(conversationId)
                        .orElseThrow();

        User sender =
                userRep.findById(senderId)
                        .orElseThrow();

        Map uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                Map.of(
                        "folder",
                        "chat_images"
                )
        );

        String imageUrl =
                uploadResult.get("secure_url").toString();

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .imageUrl(imageUrl)
                .build();

        return messageRep.save(message);
    }
}