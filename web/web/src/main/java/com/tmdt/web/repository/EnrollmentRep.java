package com.tmdt.web.repository;


import com.tmdt.web.entity.Enrollment;
import com.tmdt.web.enums.EnrollmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRep extends JpaRepository<Enrollment, Long> {

    boolean existsByClassEntityIdAndStudentId(Long classId, Long studentId);

    Optional<Enrollment> findByIdAndStudentId(Long id, Long studentId);

    Optional<Enrollment> findByClassEntityIdAndStudentId(Long classId, Long studentId);

    @Query("""
        SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END
        FROM Enrollment e
        JOIN e.classEntity c
        WHERE e.studentId = :studentId
          AND c.tutorId = :tutorId
          AND e.status = :status
    """)
    boolean existsByStudentIdAndTutorIdAndStatus(
            @Param("studentId") Long studentId,
            @Param("tutorId") Long tutorId,
            @Param("status") EnrollmentStatus status
    );

    Page<Enrollment> findByClassEntityId(Long classId, Pageable pageable);

    Page<Enrollment> findByClassEntityIdAndStatus(Long classId, EnrollmentStatus status, Pageable pageable);

    Page<Enrollment> findByStudentId(Long studentId, Pageable pageable);

    long countByStatus(EnrollmentStatus status);

    long countByClassEntityIdAndStatusIn(Long classId, List<EnrollmentStatus> statuses);

    @Query("""
        SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END
        FROM Enrollment e
        JOIN e.classEntity c
        JOIN c.schedules s
        WHERE e.studentId = :studentId
          AND e.status IN :statuses
          AND c.id <> :classId
          AND s.dayOfWeek = :dayOfWeek
          AND s.startTime < :endTime
          AND s.endTime > :startTime
    """)
    boolean existsStudentScheduleConflict(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") List<EnrollmentStatus> statuses
    );
}
