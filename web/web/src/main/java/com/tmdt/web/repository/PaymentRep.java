package com.tmdt.web.repository;

import com.tmdt.web.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRep extends JpaRepository<Payment, Integer> {


}