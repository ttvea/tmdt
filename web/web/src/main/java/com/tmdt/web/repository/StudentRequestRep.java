package com.tmdt.web.repository;

import com.tmdt.web.entity.StudentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRequestRep extends JpaRepository<StudentRequest, Long> {
    List<StudentRequest> findByUserId(Integer userId);
}