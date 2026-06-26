package com.tmdt.web.repository;

import com.tmdt.web.entity.Payout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayoutRep extends JpaRepository<Payout, Integer> {
    List<Payout> findByTutorIdOrderByCreatedAtDesc(Integer tutorId);
    List<Payout> findByStatusOrderByCreatedAtDesc(Payout.PayoutStatus status);
    List<Payout> findByTutorIdAndStatusOrderByCreatedAtDesc(Integer tutorId, Payout.PayoutStatus status);
}