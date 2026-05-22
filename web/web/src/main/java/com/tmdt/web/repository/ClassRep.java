package com.tmdt.web.repository;

import com.tmdt.web.entity.TutorClass;
import com.tmdt.web.enums.ApprovalStatus;
import com.tmdt.web.enums.ClassStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClassRep extends JpaRepository<TutorClass, Long> {

    Page<TutorClass> findByTutorId(Long tutorId, Pageable pageable);

    List<TutorClass> findByTutorId(Long tutorId);

    Page<TutorClass> findByApprovalStatus(ApprovalStatus approvalStatus, Pageable pageable);

    Page<TutorClass> findByApprovalStatusAndStatus(ApprovalStatus approvalStatus,
                                                    ClassStatus status, Pageable pageable);

    Optional<TutorClass> findByIdAndTutorId(Long id, Long tutorId);

    @Query("""
        SELECT c FROM TutorClass c
        WHERE c.approvalStatus = 'APPROVED'
          AND c.status = 'OPEN'
          AND (:subjectId IS NULL OR c.subjectId = :subjectId)
          AND (:gradeLevelId IS NULL OR c.gradeLevelId = :gradeLevelId)
          AND (:teachingMode IS NULL OR CAST(c.teachingMode AS string) = :teachingMode)
          AND (:title IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', CAST(:title as string), '%')))
          AND (:city IS NULL OR c.city = :city)
    """)
    Page<TutorClass> searchClasses(
            @Param("subjectId") Long subjectId,
            @Param("gradeLevelId") Long gradeLevelId,
            @Param("teachingMode") String teachingMode,
            @Param("title") String title,
            @Param("city") String city,
            Pageable pageable
    );
}
