package com.tmdt.web.service;

import com.tmdt.web.dto.request.VoucherRequest;
import com.tmdt.web.dto.response.VoucherResponse;
import com.tmdt.web.entity.TutorClass;
import com.tmdt.web.entity.TutorProfile;
import com.tmdt.web.entity.User;
import com.tmdt.web.entity.Voucher;
import com.tmdt.web.entity.VoucherUsage;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.enums.DiscountType;
import com.tmdt.web.enums.VoucherScope;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.ClassRep;
import com.tmdt.web.repository.TutorProfileRep;
import com.tmdt.web.repository.VoucherRep;
import com.tmdt.web.repository.VoucherUsageRep;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRep voucherRepository;
    private final TutorProfileRep tutorProfileRepository;
    private final ClassRep tutorClassRepository;
    private final VoucherUsageRep voucherUsageRepository;

    public VoucherResponse createPlatformVoucher(VoucherRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase();
        if (voucherRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw AppException.conflict("Mã voucher đã tồn tại");
        }

        validateVoucherRequest(request);

        Voucher voucher = Voucher.builder()
                .tutor(null)
                .code(normalizedCode)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minPrice(request.getMinPrice())
                .maxDiscount(request.getMaxDiscount())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .applicableScope(VoucherScope.PLATFORM)
                .tutorClass(null)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .active(true)
                .build();

        return toResponse(voucherRepository.save(voucher));
    }

    public Page<VoucherResponse> getPlatformVouchers(Pageable pageable) {
        return voucherRepository.findByApplicableScope(VoucherScope.PLATFORM, pageable)
                .map(this::toResponse);
    }

    public VoucherResponse updatePlatformVoucherStatus(Long voucherId, boolean active) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher không tồn tại"));

        if (voucher.getApplicableScope() != VoucherScope.PLATFORM) {
            throw AppException.forbidden("Chỉ được cập nhật mã giảm giá toàn hệ thống");
        }

        voucher.setActive(active);
        return toResponse(voucherRepository.save(voucher));
    }

    public VoucherResponse updatePlatformVoucher(Long voucherId, VoucherRequest request) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher không tồn tại"));

        if (voucher.getApplicableScope() != VoucherScope.PLATFORM) {
            throw AppException.forbidden("Chỉ được cập nhật mã giảm giá toàn hệ thống");
        }

        String normalizedCode = request.getCode().trim().toUpperCase();
        if (!voucher.getCode().equalsIgnoreCase(normalizedCode)
                && voucherRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw AppException.conflict("Mã voucher đã tồn tại");
        }

        validateVoucherRequest(request);

        voucher.setCode(normalizedCode);
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMinPrice(request.getMinPrice());
        voucher.setMaxDiscount(request.getMaxDiscount());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setApplicableScope(VoucherScope.PLATFORM);
        voucher.setTutorClass(null);
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());

        return toResponse(voucherRepository.save(voucher));
    }

    public VoucherResponse createTutorVoucher(Long currentUserId, VoucherRequest request) {
        TutorProfile tutor = getTutorProfile(currentUserId);

        String normalizedCode = request.getCode().trim().toUpperCase();
        if (voucherRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw AppException.conflict("Mã voucher đã tồn tại");
        }

        validateVoucherRequest(request);

        TutorClass tutorClass = null;
        VoucherScope applicableScope = request.getApplicableScope() != null
                ? request.getApplicableScope()
                : VoucherScope.ALL_CLASSES;

        if (applicableScope == VoucherScope.SPECIFIC_CLASS) {
            if (request.getClassId() == null) {
                throw AppException.badRequest("Vui lòng chọn lớp áp dụng voucher");
            }

            tutorClass = tutorClassRepository.findById(request.getClassId())
                    .orElseThrow(() -> AppException.notFound("Lớp học không tồn tại"));

            if (!tutorClass.getTutorId().equals(currentUserId)) {
                throw AppException.forbidden("Bạn không có quyền tạo voucher cho lớp này");
            }
        }

        Voucher voucher = Voucher.builder()
                .tutor(tutor)
                .code(normalizedCode)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minPrice(request.getMinPrice())
                .maxDiscount(request.getMaxDiscount())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .applicableScope(applicableScope)
                .tutorClass(tutorClass)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .active(true)
                .build();

        return toResponse(voucherRepository.save(voucher));
    }

    public List<VoucherResponse> getMyVouchers(Long currentUserId) {
        TutorProfile tutor = getTutorProfile(currentUserId);

        return voucherRepository.findByTutorId(tutor.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public VoucherResponse updateTutorVoucher(Long currentUserId, Long voucherId, VoucherRequest request) {
        TutorProfile tutor = getTutorProfile(currentUserId);

        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher không tồn tại"));

        if (voucher.getTutor() == null || voucher.getTutor().getId() != tutor.getId()) {
            throw AppException.forbidden("Bạn không có quyền cập nhật voucher này");
        }

        String normalizedCode = request.getCode().trim().toUpperCase();
        if (!voucher.getCode().equalsIgnoreCase(normalizedCode)
                && voucherRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw AppException.conflict("Mã voucher đã tồn tại");
        }

        validateVoucherRequest(request);

        TutorClass tutorClass = null;
        VoucherScope applicableScope = request.getApplicableScope() != null
                ? request.getApplicableScope()
                : VoucherScope.ALL_CLASSES;

        if (applicableScope == VoucherScope.SPECIFIC_CLASS) {
            if (request.getClassId() == null) {
                throw AppException.badRequest("Vui lòng chọn lớp áp dụng voucher");
            }

            tutorClass = tutorClassRepository.findById(request.getClassId())
                    .orElseThrow(() -> AppException.notFound("Lớp học không tồn tại"));

            if (!tutorClass.getTutorId().equals(currentUserId)) {
                throw AppException.forbidden("Bạn không có quyền cập nhật voucher cho lớp này");
            }
        }

        voucher.setCode(normalizedCode);
        voucher.setDiscountType(request.getDiscountType());
        voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMinPrice(request.getMinPrice());
        voucher.setMaxDiscount(request.getMaxDiscount());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setApplicableScope(applicableScope);
        voucher.setTutorClass(tutorClass);
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());

        return toResponse(voucherRepository.save(voucher));
    }

    public VoucherResponse updateVoucherStatus(Long currentUserId, Long voucherId, boolean active) {
        TutorProfile tutor = getTutorProfile(currentUserId);

        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher không tồn tại"));

        if (voucher.getTutor() == null || voucher.getTutor().getId() != tutor.getId()) {
            throw AppException.forbidden("Bạn không có quyền cập nhật voucher này");
        }

        voucher.setActive(active);
        return toResponse(voucherRepository.save(voucher));
    }

    public void deleteExpiredVoucher(Long currentUserId, Long voucherId) {
        TutorProfile tutor = getTutorProfile(currentUserId);

        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher không tồn tại"));

        if (voucher.getTutor() == null || voucher.getTutor().getId() != tutor.getId()) {
            throw AppException.forbidden("Bạn không có quyền xóa voucher này");
        }

        if (voucher.getEndDate() == null || voucher.getEndDate().isAfter(LocalDateTime.now())) {
            throw AppException.badRequest("Chỉ có thể xóa voucher đã hết hạn");
        }

        voucherRepository.delete(voucher);
    }

    /**
     * Lấy danh sách voucher khả dụng cho học viên (chưa sử dụng, còn hạn, còn lượt)
     */
    public List<VoucherResponse> getAvailableVouchersForStudent(Long studentId) {
        // Lấy danh sách voucher đã dùng của học viên
        List<Long> usedVoucherIds = voucherUsageRepository.findUsedVoucherIdsByStudentId(studentId);

        // Lấy tất cả voucher đang active, còn hạn, còn lượt
        List<Voucher> activeVouchers = voucherRepository.findActiveVouchers(LocalDateTime.now());

        // Lọc ra những voucher học viên chưa dùng
        return activeVouchers.stream()
                .filter(v -> !usedVoucherIds.contains(v.getId()))
                .map(this::toResponse)
                .toList();
    }

    /**
     * Nhận voucher - học viên nhận voucher từ gia sư
     */
    public VoucherResponse claimVoucher(Long studentId, Long voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> AppException.notFound("Voucher không tồn tại"));

        // Kiểm tra voucher còn hoạt động không
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

        // Kiểm tra học viên đã nhận voucher này chưa
        if (voucherUsageRepository.existsByVoucherIdAndStudentId(voucherId, studentId)) {
            throw AppException.conflict("Bạn đã nhận voucher này rồi");
        }

        // Tạo bản ghi voucher_usage (claim)
        User student = new User();
        student.setId(studentId.intValue());

        VoucherUsage usage = VoucherUsage.builder()
                .voucher(voucher)
                .student(student)
                .build();

        voucherUsageRepository.save(usage);

        // Tăng used_count
        voucher.setUsedCount(voucher.getUsedCount() == null ? 1 : voucher.getUsedCount() + 1);
        voucherRepository.save(voucher);

        return toResponse(voucher);
    }

    /**
     * Lấy danh sách voucher đang active của một gia sư (hiển thị trên trang hồ sơ gia sư)
     */
    public List<VoucherResponse> getActiveVouchersByTutor(Integer tutorUserId) {
        TutorProfile tutor = tutorProfileRepository
                .findByUserId(tutorUserId)
                .orElse(null);
        if (tutor == null) {
            return List.of();
        }

        LocalDateTime now = LocalDateTime.now();
        return voucherRepository.findByTutorId(tutor.getId())
                .stream()
                .filter(v -> v.getActive() != null && v.getActive())
                .filter(v -> v.getEndDate() == null || !v.getEndDate().isBefore(now))
                .filter(v -> v.getStartDate() == null || !v.getStartDate().isAfter(now))
                .filter(v -> v.getUsageLimit() == null || v.getUsedCount() < v.getUsageLimit())
                .map(this::toResponse)
                .toList();
    }

    private TutorProfile getTutorProfile(Long currentUserId) {
        return tutorProfileRepository
                .findByUserId(currentUserId.intValue())
                .orElseThrow(() -> AppException.notFound("Hồ sơ gia sư không tồn tại"));
    }

    private void validateVoucherRequest(VoucherRequest request) {
        if (request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw AppException.badRequest("Giá trị giảm phải lớn hơn 0");
        }

        if (request.getDiscountType() == DiscountType.PERCENT
                && request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw AppException.badRequest("Phần trăm giảm không được vượt quá 100%");
        }

        if (request.getUsageLimit() != null && request.getUsageLimit() <= 0) {
            throw AppException.badRequest("Số lượt sử dụng phải lớn hơn 0");
        }

        if (request.getStartDate() != null
                && request.getEndDate() != null
                && request.getStartDate().isAfter(request.getEndDate())) {
            throw AppException.badRequest("Ngày bắt đầu không được sau ngày kết thúc");
        }
    }

    private VoucherResponse toResponse(Voucher voucher) {
        String tutorName = null;
        if (voucher.getTutor() != null && voucher.getTutor().getUser() != null) {
            tutorName = voucher.getTutor().getUser().getFullName();
        }

        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .minPrice(voucher.getMinPrice())
                .maxDiscount(voucher.getMaxDiscount())
                .usageLimit(voucher.getUsageLimit())
                .usedCount(voucher.getUsedCount())
                .applicableScope(voucher.getApplicableScope())
                .classId(voucher.getTutorClass() != null ? voucher.getTutorClass().getId() : null)
                .tutorName(tutorName)
                .active(voucher.getActive())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .build();
    }
}