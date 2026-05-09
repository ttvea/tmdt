package com.tmdt.web.repository;

import com.tmdt.web.entity.TutorProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TutorProfileRep extends JpaRepository<TutorProfile, Integer> {
    Optional<TutorProfile> findByUserId(int userId);
}