package com.tmdt.web.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class ScheduleRequest {

    @NotNull
    @Min(value = 2, message = "Ngày trong tuần từ 2 (Thứ 2) đến 8 (Chủ nhật)")
    @Max(value = 8)
    private Integer dayOfWeek;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    private LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    private LocalTime endTime;
}

