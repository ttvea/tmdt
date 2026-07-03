package com.tmdt.web.service;

import com.tmdt.web.dto.request.AdminReviewClassRequest;
import com.tmdt.web.dto.request.ClassCreateRequest;
import com.tmdt.web.dto.request.ScheduleRequest;
import com.tmdt.web.dto.request.TutorReviewEnrollmentRequest;
import com.tmdt.web.dto.response.ClassResponse;
import com.tmdt.web.dto.response.EnrollmentResponse;
import com.tmdt.web.entity.ClassSchedule;
import com.tmdt.web.entity.*;
import com.tmdt.web.enums.*;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.mapper.ClassMapper;
import com.tmdt.web.repository.*;
import com.tmdt.web.service.PlatformFeeService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassService {

    private final ClassRep classRepository;
    private final EnrollmentRep enrollmentRepository;
    private final ClassMapper classMapper;
    private final TutorProfileRep tutorProfileRepository;
    private final OrderRep orderRepository;
    private final PaymentRep paymentRepository;
    private final VoucherRep voucherRepository;
    private final VoucherUsageRep voucherUsageRepository;
    private final PaymentService paymentService;
    private final PlatformFeeService platformFeeService;

    private static final Logger log = LoggerFactory.getLogger(ClassService.class);

    @Transactional
    public ClassResponse createClass(ClassCreateRequest request, Long tutorId) {
        validateTutorVerified(tutorId);
        validateSchedule(request);
        validateTutorScheduleConflict(request, tutorId);
        validateOfflineAddress(request);

        TutorClass classEntity = classMapper.toEntity(request, tutorId);
        classRepository.save(classEntity);
        return classMapper.toResponse(classEntity);
    }

    private void validateTutorVerified(Long tutorId) {
        TutorProfile profile = tutorProfileRepository.findByUserId(tutorId.intValue())
                .orElseThrow(() -> AppException.forbidden("Bạn cần hoàn thiện hồ sơ gia sư và chờ admin duyệt trước khi mở lớp"));

        if (!Boolean.TRUE.equals(profile.getIsVerified())) {
            throw AppException.forbidden("Hồ sơ gia sư chưa được admin duyệt. Bạn chỉ có thể mở lớp sau khi hồ sơ được xác thực");
        }
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

    @Transactional
    public ClassResponse updateClass(Long classId, Long tutorId, ClassCreateRequest request) {
        TutorClass classEntity = classRepository.findByIdAndTutorId(classId, tutorId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học"));

        if (classEntity.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw AppException.badRequest("Chỉ có thể chỉnh sửa lớp đang chờ duyệt");
        }

        validateSchedule(request);
        validateTutorScheduleConflict(request, tutorId, classId);
        validateOfflineAddress(request);

        classEntity.setTitle(request.getTitle());
        classEntity.setDescription(request.getDescription());
        classEntity.setCategoryId(request.getCategoryId());
        classEntity.setSubjectId(request.getSubjectId());
        classEntity.setGradeLevelId(request.getGradeLevelId());
        classEntity.setTeachingMode(request.getTeachingMode());
        classEntity.setPricePerCourse(request.getPricePerCourse());
        classEntity.setTotalSessions(request.getTotalSessions());
        classEntity.setMaxStudents(request.getMaxStudents() != null ? request.getMaxStudents() : 1);
        classEntity.setAddress(request.getAddress());
        classEntity.setCity(request.getCity());
        classEntity.setThumbnailUrl(request.getThumbnailUrl());

        classEntity.getSchedules().clear();
        if (request.getSchedules() != null) {
            request.getSchedules().forEach(schedule ->
                    classEntity.getSchedules().add(classMapper.toScheduleEntity(schedule, classEntity))
            );
        }

        classRepository.save(classEntity);
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

        if (classEntity.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw AppException.badRequest("Lop hoc chua duoc duyet");
        }

        if (newStatus == ClassStatus.CLOSED) {
            if (classEntity.getStatus() != ClassStatus.OPEN) {
                throw AppException.badRequest("Chi co the bat dau lop dang tuyen sinh");
            }

            long activeStudents = enrollmentRepository.countByClassEntityIdAndStatusIn(
                    classEntity.getId(), List.of(EnrollmentStatus.APPROVED, EnrollmentStatus.PAID));

            if (activeStudents < 1) {
                throw AppException.badRequest("Can it nhat 1 hoc vien de bat dau lop");
            }
        } else if (newStatus == ClassStatus.COMPLETED) {
            if (classEntity.getStatus() != ClassStatus.CLOSED) {
                throw AppException.badRequest("Chi co the ket thuc lop dang day");
            }
        } else {
            throw AppException.badRequest("Trang thai lop hoc khong hop le");
        }

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

    public ClassResponse adminGetClassDetail(Long classId) {
        TutorClass classEntity = classRepository.findById(classId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học"));
        return classMapper.toResponse(classEntity);
    }

    public Page<EnrollmentResponse> adminGetClassEnrollments(Long classId,
                                                             EnrollmentStatus statusFilter,
                                                             Pageable pageable) {
        classRepository.findById(classId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học"));

        Page<Enrollment> page = (statusFilter != null)
                ? enrollmentRepository.findByClassEntityIdAndStatus(classId, statusFilter, pageable)
                : enrollmentRepository.findByClassEntityId(classId, pageable);

        return page.map(classMapper::toEnrollmentResponse);
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

    public Page<ClassResponse> getPublicTutorTeachingClasses(Long tutorId, Pageable pageable) {
        return classRepository.findByTutorIdAndApprovalStatusAndStatusIn(
                        tutorId,
                        ApprovalStatus.APPROVED,
                        List.of(ClassStatus.CLOSED, ClassStatus.COMPLETED),
                        pageable
                )
                .map(classMapper::toResponse);
    }

    @Transactional
    public EnrollmentResponse enroll(Long classId, Long studentId, Long voucherId) {
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

        // Tính toán số tiền sau giảm giá
        Double originalAmount = classEntity.getPricePerCourse().doubleValue();
        Double finalAmount = originalAmount;
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (voucherId != null) {
            Voucher voucher = voucherRepository.findById(voucherId)
                    .orElseThrow(() -> AppException.notFound("Voucher không tồn tại"));

            // Kiểm tra voucher hợp lệ
            if (!Boolean.TRUE.equals(voucher.getActive())) {
                throw AppException.badRequest("Voucher đã bị vô hiệu hóa");
            }
            LocalDateTime now = LocalDateTime.now();
            if (voucher.getEndDate() != null && voucher.getEndDate().isBefore(now)) {
                throw AppException.badRequest("Voucher đã hết hạn");
            }
            if (voucher.getStartDate() != null && voucher.getStartDate().isAfter(now)) {
                throw AppException.badRequest("Voucher chưa đến hạn sử dụng");
            }
            if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
                throw AppException.badRequest("Voucher đã hết lượt sử dụng");
            }
            if (voucherUsageRepository.existsByVoucherIdAndStudentId(voucherId, studentId)) {
                throw AppException.conflict("Bạn đã sử dụng voucher này rồi");
            }

            // Tính discount
            if (!isVoucherApplicableToClass(voucher, classEntity)) {
                throw AppException.badRequest("Voucher không áp dụng cho lớp học này");
            }

            BigDecimal originalBD = BigDecimal.valueOf(originalAmount);
            if (voucher.getDiscountType() == DiscountType.PERCENT) {
                discountAmount = originalBD.multiply(voucher.getDiscountValue())
                        .divide(BigDecimal.valueOf(100));
            } else {
                discountAmount = voucher.getDiscountValue();
            }

            // Giới hạn max discount
            if (voucher.getMaxDiscount() != null && discountAmount.compareTo(voucher.getMaxDiscount()) > 0) {
                discountAmount = voucher.getMaxDiscount();
            }

            // Đảm bảo không giảm quá số tiền
            if (discountAmount.compareTo(originalBD) > 0) {
                discountAmount = originalBD;
            }

            finalAmount = originalBD.subtract(discountAmount).doubleValue();

            // Tạo voucher usage
            User student = new User();
            student.setId(studentId.intValue());
            VoucherUsage usage = VoucherUsage.builder()
                    .voucher(voucher)
                    .student(student)
                    .enrollment(enrollment)
                    .discountAmount(discountAmount)
                    .build();
            voucherUsageRepository.save(usage);

            // Tăng used_count
            voucher.setUsedCount(voucher.getUsedCount() == null ? 1 : voucher.getUsedCount() + 1);
            voucherRepository.save(voucher);
        }

        // Tạo Order với số tiền sau giảm
        Order order = Order.builder()
                .studentId(studentId.intValue())
                .tutorClass(classEntity)
                .amount(finalAmount)
                .status(Order.OrderStatus.PENDING)
                .build();
        orderRepository.save(order);

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

        // Cancel associated Order
        TutorClass classEntity = enrollment.getClassEntity();
        orderRepository.findByStudentIdAndClassId(studentId.intValue(), classEntity.getId()).ifPresent(order -> {
            if (order.getStatus() == Order.OrderStatus.PENDING) {
                order.setStatus(Order.OrderStatus.CANCELLED);
                orderRepository.save(order);
            }
        });

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

        classRepository.save(classEntity);
        enrollmentRepository.save(enrollment);

        // Cập nhật Order status sang PAID
        orderRepository.findByStudentIdAndClassId(studentId.intValue(), classEntity.getId()).ifPresent(order -> {
            order.setStatus(Order.OrderStatus.PAID);
            order.setPaidAt(new Date());
            orderRepository.save(order);

            // Tạo Payment record VNPAY
            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setProvider(Payment.PaymentProvider.VNPAY);
            payment.setStatus(Payment.PaymentStatus.SUCCESS);
            payment.setPaidAt(new Date());
            paymentRepository.save(payment);
        });

        return classMapper.toEnrollmentResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse requestCashPayment(Long enrollmentId, Long studentId) {
        Enrollment enrollment = enrollmentRepository.findByIdAndStudentId(enrollmentId, studentId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn đăng ký"));

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw AppException.badRequest("Đơn đăng ký chưa được gia sư duyệt hoặc đã thanh toán");
        }

        enrollment.setStatus(EnrollmentStatus.CASH_REQUESTED);
        enrollmentRepository.save(enrollment);
        return classMapper.toEnrollmentResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse confirmCashReceived(Long enrollmentId, Long tutorId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn đăng ký"));

        if (enrollment.getStatus() != EnrollmentStatus.CASH_REQUESTED) {
            throw AppException.badRequest("Học viên chưa yêu cầu thanh toán tiền mặt");
        }

        TutorClass classEntity = enrollment.getClassEntity();
        if (!classEntity.getTutorId().equals(tutorId)) {
            throw AppException.forbidden("Bạn không phải gia sư của lớp học này");
        }

        enrollment.setStatus(EnrollmentStatus.PAID);
        enrollment.setPaidAt(LocalDateTime.now());

        classEntity.setCurrentStudents(classEntity.getCurrentStudents() + 1);

        classRepository.save(classEntity);
        enrollmentRepository.save(enrollment);

        // Cập nhật Order status sang PAID
        orderRepository.findByStudentIdAndClassId(enrollment.getStudentId().intValue(), classEntity.getId()).ifPresent(order -> {
            // Áp dụng chia doanh thu (10% phí nền tảng, 90% gia sư)
            paymentService.applyRevenueSplit(order);

            order.setStatus(Order.OrderStatus.PAID);
            order.setPaidAt(new Date());
            // Gia sư đã nhận tiền mặt từ học viên, set tutorPayoutStatus = PAID
            order.setTutorPayoutStatus(Order.TutorPayoutStatus.PAID);
            order.setTutorPayoutAt(new Date());
            orderRepository.save(order);

            // Tạo Payment record CASH
            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setProvider(Payment.PaymentProvider.VNPAY);
            payment.setStatus(Payment.PaymentStatus.SUCCESS);
            payment.setTransactionId("CASH");
            payment.setPaidAt(new Date());
            paymentRepository.save(payment);

            // Tạo PlatformFeePayment để ghi nhận khoản phí nền tảng 10% cần thanh toán
            try {
                platformFeeService.createFeePayment(order);
            } catch (Exception e) {
                log.warn("Could not create PlatformFeePayment for orderId={}: {}", order.getId(), e.getMessage());
            }
        });

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
        validateTutorScheduleConflict(request, tutorId, null);
    }

    private void validateTutorScheduleConflict(ClassCreateRequest request, Long tutorId, Long ignoredClassId) {
        if (request.getSchedules() == null || request.getSchedules().isEmpty()) return;

        List<TutorClass> existingClasses = classRepository.findByTutorId(tutorId);
        for (ScheduleRequest schedule : request.getSchedules()) {
            for (TutorClass existingClass : existingClasses) {
                if (ignoredClassId != null && existingClass.getId().equals(ignoredClassId)) {
                    continue;
                }

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

    private boolean isVoucherApplicableToClass(Voucher voucher, TutorClass classEntity) {
        if (voucher.getApplicableScope() == VoucherScope.PLATFORM) {
            return true;
        }

        if (voucher.getApplicableScope() == VoucherScope.SPECIFIC_CLASS) {
            return voucher.getTutorClass() != null
                    && voucher.getTutorClass().getId().equals(classEntity.getId());
        }

        if (voucher.getApplicableScope() == VoucherScope.ALL_CLASSES) {
            return voucher.getTutor() != null
                    && voucher.getTutor().getUser() != null
                    && classEntity.getTutorId() != null
                    && Long.valueOf(voucher.getTutor().getUser().getId()).equals(classEntity.getTutorId());
        }

        return false;
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
