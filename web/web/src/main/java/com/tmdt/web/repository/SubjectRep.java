package com.tmdt.web.repository;

import com.tmdt.web.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRep extends JpaRepository<Subject, Integer> {
}
