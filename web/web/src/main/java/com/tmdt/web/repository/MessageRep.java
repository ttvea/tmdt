package com.tmdt.web.repository;

import com.tmdt.web.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRep
        extends JpaRepository<Message, Long> {

    Message findTopByConversation_IdOrderByCreatedAtDesc(
            Long conversationId
    );
    List<Message> findByConversation_IdOrderByCreatedAtAsc(
            Long conversationId
    );
}