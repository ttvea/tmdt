package com.tmdt.web.service;

import com.tmdt.web.dto.request.DisputeCreateRequest;
import com.tmdt.web.dto.response.AdminDisputeStatsResponse;
import com.tmdt.web.dto.response.DisputeNoteResponse;
import com.tmdt.web.dto.response.DisputeResponse;
import com.tmdt.web.entity.Dispute;
import com.tmdt.web.entity.DisputeNote;
import com.tmdt.web.entity.TutorClass;
import com.tmdt.web.entity.User;
import com.tmdt.web.enums.DisputePriority;
import com.tmdt.web.enums.DisputeResolutionType;
import com.tmdt.web.enums.DisputeStatus;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.ClassRep;
import com.tmdt.web.repository.DisputeNoteRep;
import com.tmdt.web.repository.DisputeRep;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DisputeService {

    private static final List<DisputeStatus> ACTIVE_STATUSES = List.of(
            DisputeStatus.PENDING,
            DisputeStatus.REVIEWING,
            DisputeStatus.NEED_EVIDENCE
    );

    private final DisputeRep disputeRep;
    private final DisputeNoteRep disputeNoteRep;
    private final UserRep userRep;
    private final ClassRep classRep;

    @Transactional
    public DisputeResponse createDispute(User creator, DisputeCreateRequest request) {
        User respondent = null;
        if (request.respondentId() != null) {
            respondent = userRep.findById(request.respondentId())
                    .orElseThrow(() -> AppException.notFound("Không tìm thấy người bị khiếu nại"));
        }

        TutorClass tutorClass = null;
        if (request.classId() != null) {
            tutorClass = classRep.findById(request.classId().longValue())
                    .orElseThrow(() -> AppException.notFound("Không tìm thấy lớp học liên quan"));
        }

        User student = creator.getRole() == User.RoleAcc.STUDENT ? creator : null;
        User tutor = creator.getRole() == User.RoleAcc.TUTOR ? creator : null;

        if (respondent != null) {
            if (respondent.getRole() == User.RoleAcc.STUDENT) {
                student = respondent;
            } else if (respondent.getRole() == User.RoleAcc.TUTOR) {
                tutor = respondent;
            }
        }

        Dispute dispute = Dispute.builder()
                .caseCode(generateCaseCode())
                .tutorClass(tutorClass)
                .student(student)
                .tutor(tutor)
                .createdBy(creator)
                .reason(request.reason().trim())
                .description(request.description().trim())
                .amount(request.amount() != null ? request.amount() : BigDecimal.ZERO)
                .status(DisputeStatus.PENDING)
                .priority(request.priority() != null ? request.priority() : DisputePriority.NORMAL)
                .resolutionType(DisputeResolutionType.NONE)
                .build();

        return DisputeResponse.from(disputeRep.save(dispute));
    }

    @Transactional(readOnly = true)
    public Page<DisputeResponse> getMyDisputes(User user, Pageable pageable) {
        return disputeRep.findUserDisputes(user.getId(), pageable)
                .map(DisputeResponse::from);
    }

    @Transactional(readOnly = true)
    public DisputeResponse getMyDisputeDetail(User user, Long disputeId) {
        Dispute dispute = disputeRep.findById(disputeId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tranh chấp"));

        boolean allowed = dispute.getCreatedBy().getId().equals(user.getId())
                || (dispute.getStudent() != null && dispute.getStudent().getId().equals(user.getId()))
                || (dispute.getTutor() != null && dispute.getTutor().getId().equals(user.getId()));

        if (!allowed) {
            throw AppException.forbidden("Bạn không có quyền xem tranh chấp này");
        }

        return toDetailResponse(dispute);
    }

    @Transactional(readOnly = true)
    public Page<DisputeResponse> getAdminDisputes(
            DisputeStatus status,
            DisputePriority priority,
            String keyword,
            Pageable pageable
    ) {
        String normalizedKeyword = keyword != null && !keyword.trim().isEmpty() ? keyword.trim() : null;
        return disputeRep.searchAdminDisputes(status, priority, normalizedKeyword, pageable)
                .map(DisputeResponse::from);
    }

    @Transactional(readOnly = true)
    public DisputeResponse getAdminDisputeDetail(Long disputeId) {
        Dispute dispute = disputeRep.findById(disputeId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tranh chấp"));
        return toDetailResponse(dispute);
    }

    @Transactional(readOnly = true)
    public AdminDisputeStatsResponse getAdminStats() {
        long total = disputeRep.count();
        long active = disputeRep.countByStatusIn(ACTIVE_STATUSES);
        long pending = disputeRep.countByStatus(DisputeStatus.PENDING);
        long resolved = disputeRep.countByStatus(DisputeStatus.RESOLVED);
        long refunded = disputeRep.countByStatus(DisputeStatus.REFUNDED);
        long rejected = disputeRep.countByStatus(DisputeStatus.REJECTED);
        long success = resolved + refunded;
        long finished = success + rejected + disputeRep.countByStatus(DisputeStatus.CLOSED);
        double successRate = finished == 0 ? 0 : BigDecimal.valueOf(success * 100.0 / finished)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();

        BigDecimal amount = disputeRep.sumAmountByStatusIn(ACTIVE_STATUSES);

        return new AdminDisputeStatsResponse(
                total,
                active,
                pending,
                resolved,
                refunded,
                rejected,
                amount != null ? amount : BigDecimal.ZERO,
                successRate
        );
    }

    @Transactional
    public DisputeResponse resolveDispute(
            Long disputeId,
            User admin,
            DisputeStatus status,
            DisputeResolutionType resolutionType,
            String resolutionNote
    ) {
        Dispute dispute = disputeRep.findById(disputeId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tranh chấp"));

        dispute.setStatus(status);
        dispute.setResolutionType(resolutionType != null ? resolutionType : DisputeResolutionType.NONE);
        dispute.setResolutionNote(normalize(resolutionNote));
        dispute.setResolvedByAdmin(admin);

        if (status == DisputeStatus.RESOLVED
                || status == DisputeStatus.REFUNDED
                || status == DisputeStatus.REJECTED
                || status == DisputeStatus.CLOSED) {
            dispute.setResolvedAt(LocalDateTime.now());
        } else {
            dispute.setResolvedAt(null);
        }

        Dispute saved = disputeRep.save(dispute);

        if (resolutionNote != null && !resolutionNote.trim().isEmpty()) {
            addNote(saved.getId(), admin, resolutionNote);
        }

        return toDetailResponse(saved);
    }

    @Transactional
    public DisputeResponse addNote(Long disputeId, User admin, String note) {
        Dispute dispute = disputeRep.findById(disputeId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy tranh chấp"));

        DisputeNote disputeNote = DisputeNote.builder()
                .dispute(dispute)
                .admin(admin)
                .note(note.trim())
                .build();

        disputeNoteRep.save(disputeNote);
        return toDetailResponse(dispute);
    }

    private DisputeResponse toDetailResponse(Dispute dispute) {
        List<DisputeNoteResponse> notes = disputeNoteRep.findByDisputeIdOrderByCreatedAtDesc(dispute.getId())
                .stream()
                .map(DisputeNoteResponse::from)
                .toList();
        return DisputeResponse.from(dispute, notes);
    }

    private String generateCaseCode() {
        String code;
        do {
            code = "DS-" + (int) (Math.random() * 900000 + 100000);
        } while (disputeRep.existsByCaseCode(code));
        return code;
    }

    private String normalize(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
