package com.tmdt.web.repository;

import com.tmdt.web.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRep extends JpaRepository<Order, Integer> {

}