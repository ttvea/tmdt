package com.tmdt.web.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void init() {
        try {
            // Fix check constraint on orders table to allow REFUNDED status
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check");
            jdbcTemplate.execute("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED'))");
            log.info("Database check constraint 'orders_status_check' updated to include REFUNDED");
        } catch (Exception e) {
            log.warn("Could not update orders_status_check constraint: {}", e.getMessage());
        }

        try {
            // Also fix tutor_payout_status check constraint if it exists
            jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tutor_payout_status_check");
            jdbcTemplate.execute("ALTER TABLE orders ADD CONSTRAINT orders_tutor_payout_status_check CHECK (tutor_payout_status IN ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED'))");
            log.info("Database check constraint 'orders_tutor_payout_status_check' updated to include REFUNDED");
        } catch (Exception e) {
            log.warn("Could not update orders_tutor_payout_status_check constraint: {}", e.getMessage());
        }
    }
}