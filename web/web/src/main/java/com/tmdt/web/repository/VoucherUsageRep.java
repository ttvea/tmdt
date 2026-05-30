package com.tmdt.web.repository;

import com.tmdt.web.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoucherUsageRep extends JpaRepository<VoucherUsage, Long> {

    boolean existsByVoucherIdAndStudentId(Long voucherId, Long studentId);
}