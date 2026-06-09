package com.tmdt.web.repository;

import com.tmdt.web.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRep extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(User.RoleAcc role);

    long countByCreatedAtAfter(java.time.LocalDateTime createdAt);

    long countByRoleAndCreatedAtBetween(User.RoleAcc role, LocalDateTime from, LocalDateTime to);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    long countByEnabled(Boolean enabled);

    List<User> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);

    List<User> findByRoleAndCreatedAtBetweenOrderByCreatedAtDesc(User.RoleAcc role, LocalDateTime from, LocalDateTime to);

    @Query("""
        SELECT u FROM User u
        WHERE (:role IS NULL OR u.role = :role)
          AND (:enabled IS NULL OR u.enabled = :enabled)
          AND (
            :keyword IS NULL
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(COALESCE(u.phone, '')) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
          )
    """)
    Page<User> searchAdminUsers(
            @Param("role") User.RoleAcc role,
            @Param("enabled") Boolean enabled,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
