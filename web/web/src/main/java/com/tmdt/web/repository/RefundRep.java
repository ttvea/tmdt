package com.tmdt.web.repository;

import com.tmdt.web.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RefundRep extends JpaRepository<Refund, Integer> {

    List<Refund> findByOrderIdOrderByCreatedAtDesc(Integer orderId);

    List<Refund> findByStudentIdOrderByCreatedAtDesc(Integer studentId);

    List<Refund> findByTutorIdOrderByCreatedAtDesc(Integer tutorId);

    List<Refund> findByStatusOrderByCreatedAtDesc(Refund.RefundStatus status);

    List<Refund> findAllByOrderByCreatedAtDesc();
}