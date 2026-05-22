package com.tmdt.web.repository;

import com.tmdt.web.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRep extends JpaRepository<Order, Integer> {

    @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = :status", nativeQuery = true)
    Double sumAmountByStatus(@Param("status") String status);
}
