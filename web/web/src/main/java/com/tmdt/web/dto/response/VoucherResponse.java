package com.tmdt.web.dto.response;

import com.tmdt.web.enums.DiscountType;
import com.tmdt.web.enums.VoucherScope;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class VoucherResponse {
    private Long id;
    private String code;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minPrice;
    private BigDecimal maxDiscount;
    private Integer usageLimit;
    private Integer usedCount;
    private VoucherScope applicableScope;
    private Long classId;
    private String tutorName;
    private Boolean active;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
