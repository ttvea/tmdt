package com.tmdt.web.repository;


import com.tmdt.web.entity.Enrollment;
import com.tmdt.web.enums.EnrollmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRep extends JpaRepository<Enrollment, Long> {

    boolean existsByClassEntityIdAndStudentId(Long classId, Long studentId);

    Optional<Enrollment> findByIdAndStudentId(Long id, Long studentId);

    Page<Enrollment> findByClassEntityId(Long classId, Pageable pageable);

    Page<Enrollment> findByClassEntityIdAndStatus(Long classId, EnrollmentStatus status, Pageable pageable);

    Page<Enrollment> findByStudentId(Long studentId, Pageable pageable);

    long countByClassEntityIdAndStatusIn(Long classId, List<EnrollmentStatus> statuses);
}
