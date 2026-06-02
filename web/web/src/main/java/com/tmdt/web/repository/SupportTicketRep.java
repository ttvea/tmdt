package com.tmdt.web.repository;

import com.tmdt.web.entity.SupportTicket;
import com.tmdt.web.enums.SupportCategory;
import com.tmdt.web.enums.SupportPriority;
import com.tmdt.web.enums.SupportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupportTicketRep extends JpaRepository<SupportTicket, Long> {

    boolean existsByTicketCode(String ticketCode);

    long countByStatus(SupportStatus status);

    long countByPriority(SupportPriority priority);

    Page<SupportTicket> findByRequesterId(Integer requesterId, Pageable pageable);

    @Query("""
        SELECT t FROM SupportTicket t
        JOIN t.requester r
        WHERE (:status IS NULL OR t.status = :status)
          AND (:category IS NULL OR t.category = :category)
          AND (:priority IS NULL OR t.priority = :priority)
          AND (
            :keyword IS NULL
            OR LOWER(t.ticketCode) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(t.subject) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(r.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(r.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
          )
    """)
    Page<SupportTicket> searchAdminTickets(
            @Param("status") SupportStatus status,
            @Param("category") SupportCategory category,
            @Param("priority") SupportPriority priority,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
