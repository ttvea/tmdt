package com.tmdt.web.repository;

import com.tmdt.web.entity.PlatformFeePayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlatformFeePaymentRep extends JpaRepository<PlatformFeePayment, Integer> {
    List<PlatformFeePayment> findByTutorIdOrderByCreatedAtDesc(Integer tutorId);
    List<PlatformFeePayment> findByTutorIdAndStatusOrderByCreatedAtDesc(Integer tutorId, PlatformFeePayment.FeePaymentStatus status);
    List<PlatformFeePayment> findByOrderId(Integer orderId);
    List<PlatformFeePayment> findByStatusOrderByCreatedAtDesc(PlatformFeePayment.FeePaymentStatus status);
}