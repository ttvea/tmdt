package com.tmdt.web.repository;

import com.tmdt.web.entity.TutorProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TutorProfileRep extends JpaRepository<TutorProfile, Integer> {
    Optional<TutorProfile> findByUserId(int userId);

    @Query("SELECT COUNT(t) FROM TutorProfile t WHERE t.isVerified = :isVerified")
    long countByVerifiedStatus(@Param("isVerified") Boolean isVerified);

    @Query("""
    SELECT DISTINCT t
    FROM TutorProfile t
    JOIN t.user u
    LEFT JOIN t.subjects s
    WHERE
        (:name IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:name as string), '%')))
        AND (:occupation IS NULL OR t.occupationType = :occupation)
        AND (:experience IS NULL OR LOWER(t.experience) LIKE LOWER(CONCAT('%', CAST(:experience as string), '%')))
        AND (:subjectName IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', CAST(:subjectName as string), '%')))
""")
    Page<TutorProfile> searchTutors(
            @Param("name") String name,
            @Param("occupation") TutorProfile.OccupationType occupation,
            @Param("experience") String experience,
            @Param("subjectName") String subjectName,
            Pageable pageable
    );
}
