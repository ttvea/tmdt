package com.tmdt.web.service;

import com.tmdt.web.config.VNPayConfig;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private final VNPayConfig vnPayConfig;

    public String createVNPayUrl(Integer orderId, Double amount) throws Exception {

        String vnp_Amount = String.valueOf((int) Math.round(amount * 100));
        String vnp_CreateDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());

        // Sắp xếp params theo thứ tự alphabet (TreeMap)
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Amount", vnp_Amount);
        params.put("vnp_Command", "pay");
        params.put("vnp_CreateDate", vnp_CreateDate);
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_Locale", "vn");
        params.put("vnp_OrderInfo", "Thanh toan khoa hoc");
        params.put("vnp_OrderType", "other");
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_TxnRef", String.valueOf(orderId));
        params.put("vnp_Version", "2.1.0");

        List<String> keys = new ArrayList<>(params.keySet());
        Collections.sort(keys);

        // Xây dựng hashData với URL-encoded values
        StringBuilder hashData = new StringBuilder();
        boolean first = true;
        for (String key : keys) {
            String value = params.get(key);
            if (!first) hashData.append("&");
            hashData.append(key).append("=")
                    .append(URLEncoder.encode(value, StandardCharsets.US_ASCII.toString()));
            first = false;
        }

        // Xây dựng query với URL-encoded values
        StringBuilder query = new StringBuilder();
        first = true;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!first) query.append("&");
            query.append(entry.getKey()).append("=")
                 .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII.toString()));
            first = false;
        }

        log.info("=== VNPAY HASH DATA ===");
        log.info("HashData: {}", hashData);
        log.info("SecretKey length: {}", vnPayConfig.getSecretKey().length());
        log.info("======================");

        // Tạo chữ ký HMAC-SHA512 - key/data bytes dùng UTF-8
        String vnp_SecureHash = hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());

        log.info("Computed hash: {}", vnp_SecureHash);

        String fullUrl = vnPayConfig.getPayUrl() + "?" + query.toString() + "&vnp_SecureHash=" + vnp_SecureHash;
        log.info("Full URL: {}", fullUrl);

        return fullUrl;
    }

    private String hmacSHA512(String key, String data) throws Exception {
        Mac hmac512 = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        hmac512.init(secretKeySpec);
        byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

        StringBuilder hash = new StringBuilder();
        for (byte b : bytes) {
            hash.append(String.format("%02x", b));
        }
        return hash.toString();
    }
}