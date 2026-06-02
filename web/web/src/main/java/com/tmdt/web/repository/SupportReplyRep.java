package com.tmdt.web.repository;

import com.tmdt.web.entity.SupportReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportReplyRep extends JpaRepository<SupportReply, Long> {
    List<SupportReply> findByTicketIdOrderByCreatedAtAsc(Long ticketId);
}
