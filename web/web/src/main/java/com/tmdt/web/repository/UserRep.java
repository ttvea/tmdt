package com.tmdt.web.repository;

import com.tmdt.web.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

public interface UserRep extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
