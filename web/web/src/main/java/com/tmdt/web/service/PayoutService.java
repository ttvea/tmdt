package com.tmdt.web.service;

import com.tmdt.web.entity.Order;
import com.tmdt.web.entity.Payout;
import com.tmdt.web.entity.User;
import com.tmdt.web.exception.AppException;
import com.tmdt.web.repository.OrderRep;
import com.tmdt.web.repository.PayoutRep;
import com.tmdt.web.repository.UserRep;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PayoutService {

    private static final Logger log = LoggerFactory.getLogger(PayoutService.class);

    private final PayoutRep payoutRepository;
    private final OrderRep orderRepository;
    private final UserRep userRepository;

    /**
     * Tính tổng tiền có thể rút của gia sư (tutorEarning của các order PAID có tutorPayoutStatus = PENDING)
     */
    public Double getAvailableBalance(Integer tutorId) {
        List<Order> pendingOrders = orderRepository.findAll().stream()
                .filter(o -> o.getTutorClass().getTutorId().equals((long) tutorId))
                .filter(o -> o.getStatus() == Order.OrderStatus.PAID)
                .filter(o -> o.getTutorPayoutStatus() == Order.TutorPayoutStatus.PENDING)
                .toList();

        return pendingOrders.stream()
                .mapToDouble(o -> o.getTutorEarning() != null ? o.getTutorEarning() : 0.0)
                .sum();
    }

    /**
     * Lấy tổng tiền đã rút thành công của gia sư
     */
    public Double getTotalPaidOut(Integer tutorId) {
        List<Payout> paidPayouts = payoutRepository.findByTutorIdAndStatusOrderByCreatedAtDesc(
                tutorId, Payout.PayoutStatus.COMPLETED);

        return paidPayouts.stream()
                .mapToDouble(Payout::getAmount)
                .sum();
    }

    /**
     * Gia sư yêu cầu rút tiền
     */
    @Transactional
    public Payout requestPayout(Integer tutorId, Double amount, String note,
                                 String bankName, String bankAccount, String bankHolder) {
        // Kiểm tra số tiền hợp lệ
        if (amount <= 0) {
            throw AppException.badRequest("Số tiền rút phải lớn hơn 0");
        }

        // Kiểm tra số dư khả dụng
        Double available = getAvailableBalance(tutorId);
        if (available < amount) {
            throw AppException.badRequest(
                    String.format("Số dư khả dụng không đủ. Khả dụng: %.0f VND, Yêu cầu: %.0f VND", available, amount));
        }

        // Kiểm tra gia sư tồn tại
        User tutor = userRepository.findById(tutorId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy gia sư"));

        Payout payout = Payout.builder()
                .tutorId(tutorId)
                .amount(amount)
                .note(note)
                .paymentMethod("bank_transfer")
                .bankName(bankName)
                .bankAccount(bankAccount)
                .bankHolder(bankHolder)
                .status(Payout.PayoutStatus.PENDING)
                .build();

        Payout saved = payoutRepository.save(payout);
        log.info("Tutor {} requested payout {} VND, payoutId={}", tutorId, amount, saved.getId());
        return saved;
    }

    /**
     * Admin duyệt payout - chuyển trạng thái thành COMPLETED và cập nhật các order tương ứng
     * (Giả định: admin đã chuyển tiền thủ công qua ngân hàng xong)
     */
    @Transactional
    public Payout approvePayout(Integer payoutId, String adminNote) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu rút tiền"));

        if (payout.getStatus() != Payout.PayoutStatus.PENDING) {
            throw AppException.badRequest("Yêu cầu rút tiền đã được xử lý trước đó");
        }

        // Cập nhật payout
        payout.setStatus(Payout.PayoutStatus.COMPLETED);
        payout.setCompletedAt(new Date());
        payout.setNote(adminNote != null ? adminNote : payout.getNote());
        payoutRepository.save(payout);

        // Cập nhật các order PAID có tutorPayoutStatus = PENDING của gia sư này
        // thành PAID (theo FIFO: ưu tiên order cũ trước) cho đến khi đủ số tiền
        List<Order> pendingOrders = orderRepository.findAll().stream()
                .filter(o -> o.getTutorClass().getTutorId().equals((long) payout.getTutorId()))
                .filter(o -> o.getStatus() == Order.OrderStatus.PAID)
                .filter(o -> o.getTutorPayoutStatus() == Order.TutorPayoutStatus.PENDING)
                .sorted((a, b) -> {
                    Date ad = a.getPaidAt() != null ? a.getPaidAt() : a.getDateCreate();
                    Date bd = b.getPaidAt() != null ? b.getPaidAt() : b.getDateCreate();
                    return ad.compareTo(bd);
                })
                .toList();

        double remaining = payout.getAmount();
        for (Order order : pendingOrders) {
            if (remaining <= 0) break;
            double tutorEarning = order.getTutorEarning() != null ? order.getTutorEarning() : 0.0;
            order.setTutorPayoutStatus(Order.TutorPayoutStatus.PAID);
            order.setTutorPayoutAt(new Date());
            orderRepository.save(order);
            remaining -= tutorEarning;
        }

        log.info("Payout {} approved for tutor {}, amount={}", payoutId, payout.getTutorId(), payout.getAmount());
        return payout;
    }

    /**
     * Admin từ chối payout
     */
    @Transactional
    public Payout rejectPayout(Integer payoutId, String reason) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu rút tiền"));

        if (payout.getStatus() != Payout.PayoutStatus.PENDING) {
            throw AppException.badRequest("Yêu cầu rút tiền đã được xử lý trước đó");
        }

        payout.setStatus(Payout.PayoutStatus.FAILED);
        payout.setNote(reason);
        payoutRepository.save(payout);

        log.info("Payout {} rejected for tutor {}, reason={}", payoutId, payout.getTutorId(), reason);
        return payout;
    }

    /**
     * Lấy lịch sử payout của một gia sư
     */
    public List<Payout> getTutorPayoutHistory(Integer tutorId) {
        return payoutRepository.findByTutorIdOrderByCreatedAtDesc(tutorId);
    }

    /**
     * Admin lấy tất cả các yêu cầu payout
     */
    public List<Payout> getAllPayouts(Payout.PayoutStatus status) {
        if (status != null) {
            return payoutRepository.findByStatusOrderByCreatedAtDesc(status);
        }
        return payoutRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
    }

    /**
     * Admin lấy danh sách order chờ payout của một gia sư
     */
    public List<Order> getPendingOrdersForTutor(Integer tutorId) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getTutorClass().getTutorId().equals((long) tutorId))
                .filter(o -> o.getStatus() == Order.OrderStatus.PAID)
                .filter(o -> o.getTutorPayoutStatus() == Order.TutorPayoutStatus.PENDING)
                .sorted((a, b) -> {
                    Date ad = a.getPaidAt() != null ? a.getPaidAt() : a.getDateCreate();
                    Date bd = b.getPaidAt() != null ? b.getPaidAt() : b.getDateCreate();
                    return ad.compareTo(bd);
                })
                .toList();
    }
}