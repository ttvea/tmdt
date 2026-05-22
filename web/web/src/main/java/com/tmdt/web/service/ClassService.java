package com.tmdt.web.service;

import com.tmdt.web.dto.request.AdminReviewClassRequest;
import com.tmdt.web.dto.request.ClassCreateRequest;
import com.tmdt.web.dto.request.ScheduleRequest;
import com.tmdt.web.dto.request.TutorReviewEnrollmentRequest;
import com.tmdt.web.dto.response.ClassResponse;
import com.tmdt.web.dto.response.EnrollmentResponse;
import com.tmdt.web.entity.ClassSchedule;
import com.tmdt.web.entity.Enrollment;
import com.tmdt.web.entity.TutorClass;
import com.tmdt.web.enums.ApprovalStatus;
import com.tmdt.web.enums.ClassStatus;
import com.tmdt.web.enums.EnrollmentStatus;
import com.tmdt.web.enums.TeachingMode;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.mapper.ClassMapper;
import com.tmdt.web.repository.ClassRep;
import com.tmdt.web.repository.EnrollmentRep;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassService {

    private final ClassRep classRepository;
    private final EnrollmentRep enrollmentRepository;
    private final ClassMapper classMapper;

    @Transactional
    public ClassResponse createClass(ClassCreateRequest request, Long tutorId) {
        validateSchedule(request);
        validateTutorScheduleConflict(request, tutorId);
        validateOfflineAddress(request);

        TutorClass classEntity = classMapper.toEntity(request, tutorId);
        classRepository.save(classEntity);
        return classMapper.toResponse(classEntity);
    }

    public Page<ClassResponse> getTutorClasses(Long tutorId, Pageable pageable) {
        return classRepository.findByTutorId(tutorId, pageable)
                .map(classMapper::toResponse);
    }

    public ClassResponse getTutorClassDetail(Long classId, Long tutorId) {
        TutorClass classEntity = classRepository.findByIdAndTutorId(classId, tutorId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học"));
        return classMapper.toResponse(classEntity);
    }

    public Page<EnrollmentResponse> getEnrollmentsOfClass(Long classId, Long tutorId,
                                                          EnrollmentStatus statusFilter,
                                                          Pageable pageable) {
        classRepository.findByIdAndTutorId(classId, tutorId)
                .orElseThrow(() -> AppException.forbidden("Bạn không có quyền xem lớp này"));

        Page<Enrollment> page = (statusFilter != null)
                ? enrollmentRepository.findByClassEntityIdAndStatus(classId, statusFilter, pageable)
                : enrollmentRepository.findByClassEntityId(classId, pageable);

        return page.map(classMapper::toEnrollmentResponse);
    }

    @Transactional
    public EnrollmentResponse reviewEnrollment(Long enrollmentId, Long tutorId,
                                               TutorReviewEnrollmentRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn đăng ký"));

        TutorClass classEntity = enrollment.getClassEntity();

        if (!classEntity.getTutorId().equals(tutorId)) {
            throw AppException.forbidden("Bạn không có quyền duyệt lớp này");
        }
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw AppException.badRequest("Đơn đăng ký không ở trạng thái chờ duyệt");
        }

        if (request.getApproved()) {
            long approvedCount = enrollmentRepository.countByClassEntityIdAndStatusIn(
                    classEntity.getId(), List.of(EnrollmentStatus.APPROVED, EnrollmentStatus.PAID));
            if (approvedCount >= classEntity.getMaxStudents()) {
                throw AppException.badRequest("Lớp đã đủ sĩ số, không thể duyệt thêm");
            }
            enrollment.setStatus(EnrollmentStatus.APPROVED);
            enrollment.setApprovedAt(LocalDateTime.now());

            if (approvedCount + 1 >= classEntity.getMaxStudents()) {
                classEntity.setStatus(ClassStatus.CLOSED);
                classRepository.save(classEntity);
            }
        } else {
            if (request.getNote() == null || request.getNote().isBlank()) {
                throw AppException.badRequest("Vui lòng cung cấp lý do từ chối");
            }
            enrollment.setStatus(EnrollmentStatus.REJECTED);
            enrollment.setNote(request.getNote());
        }

        enrollmentRepository.save(enrollment);
        return classMapper.toEnrollmentResponse(enrollment);
    }

    @Transactional
    public ClassResponse updateClassStatus(Long classId, Long tutorId, ClassStatus newStatus) {
        TutorClass classEntity = classRepository.findByIdAndTutorId(classId, tutorId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học"));

        classEntity.setStatus(newStatus);
        classRepository.save(classEntity);
        return classMapper.toResponse(classEntity);
    }

    public Page<ClassResponse> getPendingClasses(Pageable pageable) {
        return classRepository.findByApprovalStatus(ApprovalStatus.PENDING, pageable)
                .map(classMapper::toResponse);
    }

    @Transactional
    public ClassResponse adminReviewClass(Long classId, AdminReviewClassRequest request) {
        TutorClass classEntity = classRepository.findById(classId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học"));

        if (classEntity.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw AppException.badRequest("Lớp học không ở trạng thái chờ duyệt");
        }

        if (request.getApproved()) {
            classEntity.setApprovalStatus(ApprovalStatus.APPROVED);
            classEntity.setStatus(ClassStatus.OPEN);
        } else {
            if (request.getRejectReason() == null || request.getRejectReason().isBlank()) {
                throw AppException.badRequest("Vui lòng cung cấp lý do từ chối");
            }
            classEntity.setApprovalStatus(ApprovalStatus.REJECTED);
            classEntity.setRejectReason(request.getRejectReason());
        }

        classRepository.save(classEntity);
        return classMapper.toResponse(classEntity);
    }

    public Page<ClassResponse> adminGetAllClasses(ApprovalStatus approvalStatus, Pageable pageable) {
        if (approvalStatus != null) {
            return classRepository.findByApprovalStatus(approvalStatus, pageable)
                    .map(classMapper::toResponse);
        }
        return classRepository.findAll(pageable).map(classMapper::toResponse);
    }

    public Page<ClassResponse> searchClasses(Long subjectId, Long gradeLevelId,
                                             String teachingMode,String title, String city,
                                             Pageable pageable) {
        return classRepository.searchClasses(subjectId, gradeLevelId, teachingMode,title, city, pageable)
                .map(classMapper::toResponse);
    }

    public ClassResponse getClassDetail(Long classId) {
        TutorClass classEntity = classRepository.findById(classId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học"));

        if (classEntity.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw AppException.notFound("Không tìm thấy lớp học");
        }
        return classMapper.toResponse(classEntity);
    }

    @Transactional
    public EnrollmentResponse enroll(Long classId, Long studentId) {
        TutorClass classEntity = classRepository.findById(classId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học"));

        if (classEntity.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw AppException.badRequest("Lớp học chưa được phê duyệt");
        }
        if (classEntity.getStatus() != ClassStatus.OPEN) {
            throw AppException.badRequest("Lớp học hiện không mở đăng ký");
        }

        long approvedCount = enrollmentRepository.countByClassEntityIdAndStatusIn(
                classId, List.of(EnrollmentStatus.APPROVED, EnrollmentStatus.PAID));
        if (approvedCount >= classEntity.getMaxStudents()) {
            throw AppException.badRequest("Lớp học đã đầy");
        }

        if (enrollmentRepository.existsByClassEntityIdAndStudentId(classId, studentId)) {
            throw AppException.conflict("Bạn đã đăng ký lớp học này rồi");
        }

        if (classEntity.getTutorId().equals(studentId)) {
            throw AppException.badRequest("Gia sư không thể đăng ký lớp của chính mình");
        }

        validateStudentScheduleConflict(classEntity, studentId);

        Enrollment enrollment = Enrollment.builder()
                .classEntity(classEntity)
                .studentId(studentId)
                .status(EnrollmentStatus.PENDING)
                .build();

        enrollmentRepository.save(enrollment);
        return classMapper.toEnrollmentResponse(enrollment);
    }

    public Page<EnrollmentResponse> getStudentEnrollments(Long studentId, Pageable pageable) {
        return enrollmentRepository.findByStudentId(studentId, pageable)
                .map(classMapper::toEnrollmentResponse);
    }

    @Transactional
    public EnrollmentResponse cancelEnrollment(Long enrollmentId, Long studentId) {
        Enrollment enrollment = enrollmentRepository.findByIdAndStudentId(enrollmentId, studentId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn đăng ký"));

        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw AppException.badRequest("Chỉ có thể huỷ đơn đang chờ duyệt");
        }

        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        enrollmentRepository.save(enrollment);
        return classMapper.toEnrollmentResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse confirmPayment(Long enrollmentId, Long studentId) {
        Enrollment enrollment = enrollmentRepository.findByIdAndStudentId(enrollmentId, studentId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn đăng ký"));

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw AppException.badRequest("Đơn đăng ký chưa được gia sư duyệt hoặc đã thanh toán");
        }

        enrollment.setStatus(EnrollmentStatus.PAID);
        enrollment.setPaidAt(LocalDateTime.now());

        TutorClass classEntity = enrollment.getClassEntity();
        classEntity.setCurrentStudents(classEntity.getCurrentStudents() + 1);

        long paidCount = enrollmentRepository.countByClassEntityIdAndStatusIn(
                classEntity.getId(), List.of(EnrollmentStatus.PAID));
        if (paidCount + 1 >= classEntity.getMaxStudents()) {
            classEntity.setStatus(ClassStatus.CLOSED);
        }

        classRepository.save(classEntity);
        enrollmentRepository.save(enrollment);
        return classMapper.toEnrollmentResponse(enrollment);
    }

    private void validateSchedule(ClassCreateRequest request) {
        if (request.getSchedules() == null || request.getSchedules().isEmpty()) return;
        request.getSchedules().forEach(s -> {
            if (s.getEndTime().isBefore(s.getStartTime()) || s.getEndTime().equals(s.getStartTime())) {
                throw AppException.badRequest("Giờ kết thúc phải sau giờ bắt đầu");
            }
        });

        List<ScheduleRequest> schedules = request.getSchedules();
        for (int i = 0; i < schedules.size(); i++) {
            ScheduleRequest current = schedules.get(i);
            for (int j = i + 1; j < schedules.size(); j++) {
                ScheduleRequest next = schedules.get(j);
                if (current.getDayOfWeek().equals(next.getDayOfWeek())
                        && isTimeOverlapping(current.getStartTime(), current.getEndTime(),
                        next.getStartTime(), next.getEndTime())) {
                    throw AppException.badRequest("Thời khóa biểu của lớp học không được trùng giờ");
                }
            }
        }
    }

    private void validateTutorScheduleConflict(ClassCreateRequest request, Long tutorId) {
        if (request.getSchedules() == null || request.getSchedules().isEmpty()) return;

        List<TutorClass> existingClasses = classRepository.findByTutorId(tutorId);
        for (ScheduleRequest schedule : request.getSchedules()) {
            for (TutorClass existingClass : existingClasses) {
                if (existingClass.getApprovalStatus() == ApprovalStatus.REJECTED
                        || existingClass.getStatus() == ClassStatus.COMPLETED) {
                    continue;
                }

                for (ClassSchedule existingSchedule : existingClass.getSchedules()) {
                    if (schedule.getDayOfWeek().equals(existingSchedule.getDayOfWeek())
                            && isTimeOverlapping(schedule.getStartTime(), schedule.getEndTime(),
                            existingSchedule.getStartTime(), existingSchedule.getEndTime())) {
                        throw AppException.badRequest("Thời khóa biểu bị trùng với một lớp khác của bạn");
                    }
                }
            }
        }
    }


    private void validateStudentScheduleConflict(TutorClass targetClass, Long studentId) {
        if (targetClass.getSchedules() == null || targetClass.getSchedules().isEmpty()) return;

        for (ClassSchedule schedule : targetClass.getSchedules()) {
            boolean hasConflict = enrollmentRepository.existsStudentScheduleConflict(
                    studentId,
                    targetClass.getId(),
                    schedule.getDayOfWeek(),
                    schedule.getStartTime(),
                    schedule.getEndTime(),
                    List.of(EnrollmentStatus.APPROVED, EnrollmentStatus.PAID)
            );

            if (hasConflict) {
                throw AppException.badRequest("Lịch học của bạn bị trùng với một lớp đã đăng ký");
            }
        }
    }

    private boolean isTimeOverlapping(LocalTime firstStart, LocalTime firstEnd,
                                      LocalTime secondStart, LocalTime secondEnd) {
        return firstStart.isBefore(secondEnd) && firstEnd.isAfter(secondStart);
    }

    private void validateOfflineAddress(ClassCreateRequest request) {
        if (request.getTeachingMode() != null &&
                request.getTeachingMode().name().equals("OFFLINE")) {
            if (request.getAddress() == null || request.getAddress().isBlank()) {
                throw AppException.badRequest("Địa chỉ không được để trống với lớp học OFFLINE");
            }
        }
    }
}
