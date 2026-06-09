package com.tmdt.web.repository;

import com.tmdt.web.entity.Dispute;
import com.tmdt.web.enums.DisputePriority;
import com.tmdt.web.enums.DisputeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface DisputeRep extends JpaRepository<Dispute, Long> {

    boolean existsByCaseCode(String caseCode);

    List<Dispute> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);

    long countByStatus(DisputeStatus status);

    long countByStatusIn(Collection<DisputeStatus> statuses);

    @Query("SELECT SUM(d.amount) FROM Dispute d WHERE d.status IN :statuses")
    BigDecimal sumAmountByStatusIn(@Param("statuses") Collection<DisputeStatus> statuses);

    @Query("""
        SELECT d FROM Dispute d
        LEFT JOIN d.student s
        LEFT JOIN d.tutor t
        WHERE (:status IS NULL OR d.status = :status)
          AND (:priority IS NULL OR d.priority = :priority)
          AND (
            :keyword IS NULL
            OR LOWER(d.caseCode) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(d.reason) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(COALESCE(s.fullName, '')) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(COALESCE(t.fullName, '')) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
          )
    """)
    Page<Dispute> searchAdminDisputes(
            @Param("status") DisputeStatus status,
            @Param("priority") DisputePriority priority,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
        SELECT d FROM Dispute d
        WHERE d.createdBy.id = :userId OR d.student.id = :userId OR d.tutor.id = :userId
    """)
    Page<Dispute> findUserDisputes(@Param("userId") Integer userId, Pageable pageable);
}
