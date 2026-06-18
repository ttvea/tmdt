package com.tmdt.web.repository;

import com.tmdt.web.entity.Voucher;
import com.tmdt.web.enums.VoucherScope;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VoucherRep extends JpaRepository<Voucher, Long> {

    boolean existsByCodeIgnoreCase(String code);

    Optional<Voucher> findByCode(String code);

    List<Voucher> findByTutorId(Integer tutorId);

    Page<Voucher> findByApplicableScope(VoucherScope applicableScope, Pageable pageable);

    @Query("SELECT v FROM Voucher v WHERE v.active = true " +
           "AND (v.endDate IS NULL OR v.endDate >= :now) " +
           "AND (v.startDate IS NULL OR v.startDate <= :now) " +
           "AND (v.usageLimit IS NULL OR v.usedCount < v.usageLimit) " +
           "ORDER BY v.createdAt DESC")
    List<Voucher> findActiveVouchers(@Param("now") LocalDateTime now);
}
