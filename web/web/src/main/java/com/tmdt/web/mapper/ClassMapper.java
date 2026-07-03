package com.tmdt.web.mapper;

import com.tmdt.web.dto.request.ClassCreateRequest;
import com.tmdt.web.dto.request.ScheduleRequest;
import com.tmdt.web.dto.response.ClassResponse;
import com.tmdt.web.dto.response.EnrollmentResponse;
import com.tmdt.web.dto.response.ScheduleResponse;
import com.tmdt.web.entity.TutorClass;
import com.tmdt.web.entity.ClassSchedule;
import com.tmdt.web.entity.Category;
import com.tmdt.web.entity.Enrollment;
import com.tmdt.web.entity.Subject;
import com.tmdt.web.entity.GradeLevel;
import com.tmdt.web.entity.User;
import com.tmdt.web.enums.EnrollmentStatus;
import com.tmdt.web.repository.CategoryRep;
import com.tmdt.web.repository.EnrollmentRep;
import com.tmdt.web.repository.GradeLevelRep;
import com.tmdt.web.repository.OrderRep;
import com.tmdt.web.repository.SubjectRep;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ClassMapper {

    private final SubjectRep subjectRep;
    private final GradeLevelRep gradeLevelRep;
    private final CategoryRep categoryRep;
    private final UserRep userRep;
    private final EnrollmentRep enrollmentRepository;
    private final OrderRep orderRep;

    private static final String[] DAY_LABELS = {
            "", "", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"
    };

    public TutorClass toEntity(ClassCreateRequest req, Long tutorId) {
        TutorClass entity = TutorClass.builder()
                .tutorId(tutorId)
                .title(req.getTitle())
                .description(req.getDescription())
                .categoryId(req.getCategoryId())
                .subjectId(req.getSubjectId())
                .gradeLevelId(req.getGradeLevelId())
                .teachingMode(req.getTeachingMode())
                .pricePerCourse(req.getPricePerCourse())
                .totalSessions(req.getTotalSessions())
                .maxStudents(req.getMaxStudents() != null ? req.getMaxStudents() : 1)
                .address(req.getAddress())
                .city(req.getCity())
                .thumbnailUrl(req.getThumbnailUrl())
                .build();

        if (req.getSchedules() != null) {
            List<ClassSchedule> schedules = req.getSchedules().stream()
                    .map(s -> toScheduleEntity(s, entity))
                    .collect(Collectors.toList());
            entity.getSchedules().addAll(schedules);
        }

        return entity;
    }

    public ClassSchedule toScheduleEntity(ScheduleRequest req, TutorClass classEntity) {
        return ClassSchedule.builder()
                .classEntity(classEntity)
                .dayOfWeek(req.getDayOfWeek())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .build();
    }

    public ClassResponse toResponse(TutorClass entity) {
        String subjectName = entity.getSubjectId() != null
                ? subjectRep.findById(entity.getSubjectId().intValue())
                        .map(Subject::getName).orElse("—")
                : "—";

        String gradeLevelName = entity.getGradeLevelId() != null
                ? gradeLevelRep.findById(entity.getGradeLevelId().intValue())
                        .map(GradeLevel::getName).orElse("—")
                : "—";

        String categoryName = entity.getCategoryId() != null
                ? categoryRep.findById(entity.getCategoryId())
                        .map(Category::getName).orElse(null)
                : null;

        String tutorName = entity.getTutorId() != null
                ? userRep.findById(entity.getTutorId().intValue())
                        .map(User::getFullName).orElse(null)
                : null;

    long actualStudents = enrollmentRepository.countByClassEntityIdAndStatusIn(
            entity.getId(), List.of(EnrollmentStatus.APPROVED, EnrollmentStatus.PAID));

    return ClassResponse.builder()
                .id(entity.getId())
                .tutorId(entity.getTutorId())
                .tutorName(tutorName)
                .title(entity.getTitle())
                .description(entity.getDescription())
                .categoryId(entity.getCategoryId())
                .categoryName(categoryName)
                .subjectId(entity.getSubjectId())
                .subjectName(subjectName)
                .gradeLevelId(entity.getGradeLevelId())
                .gradeLevelName(gradeLevelName)
                .teachingMode(entity.getTeachingMode())
                .pricePerCourse(entity.getPricePerCourse())
                .totalSessions(entity.getTotalSessions())
                .maxStudents(entity.getMaxStudents())
                .currentStudents((int) actualStudents)
                .approvalStatus(entity.getApprovalStatus())
                .rejectReason(entity.getRejectReason())
                .status(entity.getStatus())
                .address(entity.getAddress())
                .city(entity.getCity())
                .thumbnailUrl(entity.getThumbnailUrl())
                .schedules(entity.getSchedules().stream()
                        .map(this::toScheduleResponse)
                        .collect(Collectors.toList()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public ScheduleResponse toScheduleResponse(ClassSchedule s) {
        String dayLabel = (s.getDayOfWeek() >= 2 && s.getDayOfWeek() <= 8)
                ? DAY_LABELS[s.getDayOfWeek()] : "Không xác định";
        return ScheduleResponse.builder()
                .id(s.getId())
                .dayOfWeek(s.getDayOfWeek())
                .dayLabel(dayLabel)
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .build();
    }

    public EnrollmentResponse toEnrollmentResponse(Enrollment e) {
        User student = userRep.findById(e.getStudentId().intValue()).orElse(null);

        // Tìm Order tương ứng để lấy orderId và amount
        Integer orderId = null;
        Long amount = null;
        if (e.getClassEntity() != null) {
            java.util.Optional<com.tmdt.web.entity.Order> orderOpt = orderRep.findByStudentIdAndClassId(
                    e.getStudentId().intValue(), e.getClassEntity().getId());
            if (orderOpt.isPresent()) {
                orderId = orderOpt.get().getId();
                amount = orderOpt.get().getAmount().longValue();
            }
        }

        return EnrollmentResponse.builder()
                .id(e.getId())
                .classId(e.getClassEntity().getId())
                .tutorId(e.getClassEntity().getTutorId())
                .classStatus(e.getClassEntity().getStatus())
                .classTitle(e.getClassEntity().getTitle())
                .studentId(e.getStudentId())
                .studentName(student != null ? student.getFullName() : null)
                .studentEmail(student != null ? student.getEmail() : null)
                .studentPhone(student != null ? student.getPhone() : null)
                .studentAvatar(student != null ? student.getAvatar() : null)
                .status(e.getStatus())
                .note(e.getNote())
                .approvedAt(e.getApprovedAt())
                .paidAt(e.getPaidAt())
                .createdAt(e.getCreatedAt())
                .orderId(orderId)
                .amount(amount)
                .build();
    }
}
