package com.tmdt.web.repository;

import com.tmdt.web.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RatingRep extends JpaRepository<Rating, Long> {

   

    List<Rating> findByTutorIdOrderByCreatedAtDesc(Integer tutorId);
    
    
    @Query("""
        SELECT AVG(r.stars)
        FROM Rating r
        WHERE r.tutor.id = :tutorId
    """)
    Double getAverageRating(
            @Param("tutorId") Integer tutorId
    );

    boolean existsByStudentIdAndTutorId(Integer studentId, Integer tutorId);
}

