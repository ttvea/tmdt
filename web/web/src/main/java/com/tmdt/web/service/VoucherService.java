package com.tmdt.web.service;

import com.tmdt.web.dto.request.VoucherRequest;
import com.tmdt.web.dto.response.VoucherResponse;
import com.tmdt.web.entity.TutorClass;
import com.tmdt.web.entity.TutorProfile;
import com.tmdt.web.entity.Voucher;
import com.tmdt.web.enums.DiscountType;
import com.tmdt.web.enums.VoucherScope;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.ClassRep;
import com.tmdt.web.repository.TutorProfileRep;
import com.tmdt.web.repository.VoucherRep;
import lombok.RequiredArgsConstructor;
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
                .active(voucher.getActive())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .build();
    }
}
