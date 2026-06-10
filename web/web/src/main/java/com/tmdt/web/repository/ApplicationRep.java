package com.tmdt.web.repository;

import com.tmdt.web.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRep
        extends JpaRepository<Application, Long> {

    List<Application> findByStudentRequestId(Long studentRequestId);
    List<Application> findByStudentRequestUserId(Integer studentId);

    List<Application> findByTutorId(Integer tutorId);

    boolean existsByStudentRequestIdAndTutorId(
            Long studentRequestId,
            Integer tutorId
    );
}
