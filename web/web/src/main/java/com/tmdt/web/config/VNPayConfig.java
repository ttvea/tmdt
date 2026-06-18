package com.tmdt.web.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class VNPayConfig {

    private static final Logger log = LoggerFactory.getLogger(VNPayConfig.class);

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String secretKey;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    @PostConstruct
    public void init() {
        log.info("=== VNPAY CONFIG ===");
        log.info("tmnCode: '{}'", tmnCode);
        log.info("secretKey: '{}'", secretKey != null ? secretKey.substring(0, Math.min(4, secretKey.length())) + "..." : "NULL");
        log.info("payUrl: '{}'", payUrl);
        log.info("returnUrl: '{}'", returnUrl);
        log.info("====================");
    }
}