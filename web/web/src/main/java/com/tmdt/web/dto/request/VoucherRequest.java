package com.tmdt.web.dto.request;

import com.tmdt.web.enums.DiscountType;
import com.tmdt.web.enums.VoucherScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class VoucherRequest {
    @NotBlank
    private String code;
    @NotNull
    private DiscountType discountType;
    @NotNull
    private BigDecimal discountValue;
    private BigDecimal minPrice;
    private BigDecimal maxDiscount;
    private Integer usageLimit;
    private VoucherScope applicableScope = VoucherScope.ALL_CLASSES;
    private Long classId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
