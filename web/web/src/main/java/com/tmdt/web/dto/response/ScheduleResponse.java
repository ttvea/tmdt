package com.tmdt.web.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalTime;

@Data
@Builder
public class ScheduleResponse {
    private Long id;
    private Integer dayOfWeek;
    private String dayLabel;
    private LocalTime startTime;
    private LocalTime endTime;
}
