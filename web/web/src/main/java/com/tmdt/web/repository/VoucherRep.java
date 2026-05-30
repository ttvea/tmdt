package com.tmdt.web.repository;

import com.tmdt.web.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoucherRep extends JpaRepository<Voucher, Long> {

    boolean existsByCodeIgnoreCase(String code);

    Optional<Voucher> findByCode(String code);

    List<Voucher> findByTutorId(Integer tutorId);
}
