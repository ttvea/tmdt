package com.tmdt.web.service;

import com.tmdt.web.config.VNPayConfig;
import lombok.RequiredArgsConstructor;
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

    private final VNPayConfig vnPayConfig;

    public String createVNPayUrl(Integer orderId, Double amount) throws Exception {

        String vnp_TxnRef = String.valueOf(orderId);

        String vnp_Amount = String.valueOf((int)(amount * 100));

        String vnp_CreateDate = new SimpleDateFormat("yyyyMMddHHmmss")
                .format(new Date());

        Map<String, String> params = new TreeMap<>();

        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());

        params.put("vnp_Amount", vnp_Amount);

        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", vnp_TxnRef);

        params.put("vnp_OrderInfo", "Thanh toan khoa hoc");

        params.put("vnp_OrderType", "other");

        params.put("vnp_Locale", "vn");

        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());

        params.put("vnp_IpAddr", "127.0.0.1");

        params.put("vnp_CreateDate", vnp_CreateDate);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (Map.Entry<String, String> entry : params.entrySet()) {

            if (!hashData.isEmpty()) {
                hashData.append("&");
                query.append("&");
            }

            hashData.append(entry.getKey())
                    .append("=")
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));

            query.append(entry.getKey())
                    .append("=")
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }

        String secureHash = hmacSHA512(
                vnPayConfig.getSecretKey(),
                hashData.toString()
        );

        query.append("&vnp_SecureHash=").append(secureHash);

        return vnPayConfig.getPayUrl() + "?" + query;
    }

    private String hmacSHA512(String key, String data) throws Exception {

        Mac hmac512 = Mac.getInstance("HmacSHA512");

        SecretKeySpec secretKeySpec =
                new SecretKeySpec(key.getBytes(), "HmacSHA512");

        hmac512.init(secretKeySpec);

        byte[] bytes = hmac512.doFinal(data.getBytes());

        StringBuilder hash = new StringBuilder();

        for (byte b : bytes) {
            hash.append(String.format("%02x", b));
        }

        return hash.toString();
    }
}
