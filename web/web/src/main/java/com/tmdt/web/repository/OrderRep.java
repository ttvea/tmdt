package com.tmdt.web.repository;

import com.tmdt.web.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;

public interface OrderRep extends JpaRepository<Order, Integer> {

    @Query(value = "SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = :status", nativeQuery = true)
    Double sumAmountByStatus(@Param("status") String status);

    @Query(value = """
            SELECT COALESCE(SUM(COALESCE(platform_fee, amount * 0.1)), 0)
            FROM orders
            WHERE status = :status
            """, nativeQuery = true)
    Double sumPlatformFeeByStatus(@Param("status") String status);

    List<Order> findByStatusAndDateCreateBetweenOrderByDateCreateDesc(
            Order.OrderStatus status,
            Date from,
            Date to
    );

    @Query("SELECT o FROM Order o WHERE o.studentId = :studentId AND o.tutorClass.id = :classId")
    java.util.Optional<Order> findByStudentIdAndClassId(@Param("studentId") int studentId, @Param("classId") Long classId);
}
