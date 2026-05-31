package com.tmdt.web.repository;

import com.tmdt.web.entity.StudentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRequestRep extends JpaRepository<StudentRequest, Long> {
}