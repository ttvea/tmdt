package com.tmdt.web.repository;

import com.tmdt.web.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VoucherUsageRep extends JpaRepository<VoucherUsage, Long> {

    boolean existsByVoucherIdAndStudentId(Long voucherId, Long studentId);

    @Query("SELECT v.voucher.id FROM VoucherUsage v WHERE v.student.id = :studentId")
    List<Long> findUsedVoucherIdsByStudentId(@Param("studentId") Long studentId);
}
