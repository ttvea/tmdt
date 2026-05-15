package com.tmdt.web.dto.request;


import com.tmdt.web.enums.TeachingMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ClassCreateRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255)
    private String title;

    private String description;

    private Integer categoryId;

    @NotNull(message = "Môn học không được để trống")
    private Long subjectId;

    private Long gradeLevelId;

    @NotNull(message = "Hình thức dạy không được để trống")
    private TeachingMode teachingMode;

    @DecimalMin(value = "0.0", inclusive = false, message = "Học phí phải lớn hơn 0")
    private BigDecimal pricePerCourse;

    @Min(value = 1, message = "Tổng số buổi phải ít nhất 1")
    private Integer totalSessions;

    @Min(value = 1, message = "Sĩ số tối đa phải ít nhất 1")
    private Integer maxStudents;

    private String address;
    private String city;

    private String thumbnailUrl;

    @NotEmpty(message = "Lịch học không được để trống")
    @Valid
    private List<ScheduleRequest> schedules;
}
