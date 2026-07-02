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

    private double getTutorEarning(Order order) {
        return order.getTutorEarning() != null ? order.getTutorEarning() : 0.0;
    }

    private double getTutorPayoutPaidAmount(Order order) {
        return order.getTutorPayoutPaidAmount() != null ? order.getTutorPayoutPaidAmount() : 0.0;
    }

    private double getTutorPayoutRemainingAmount(Order order) {
        return Math.max(0.0, getTutorEarning(order) - getTutorPayoutPaidAmount(order));
    }

    private double getOrderPayoutBalance(Integer tutorId) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getTutorClass().getTutorId().equals((long) tutorId))
                .filter(o -> o.getStatus() == Order.OrderStatus.PAID)
                .filter(o -> o.getTutorPayoutStatus() == Order.TutorPayoutStatus.PENDING)
                .mapToDouble(this::getTutorPayoutRemainingAmount)
                .sum();
    }

    public Double getPendingPayoutRequestAmount(Integer tutorId) {
        return payoutRepository.findByTutorIdAndStatusOrderByCreatedAtDesc(tutorId, Payout.PayoutStatus.PENDING)
                .stream()
                .mapToDouble(Payout::getAmount)
                .sum();
    }

    /**
     * Tính tổng tiền có thể rút của gia sư (tutorEarning của các order PAID có tutorPayoutStatus = PENDING)
     */
    public Double getAvailableBalance(Integer tutorId) {
        return getOrderPayoutBalance(tutorId);
    }

    public Double getWithdrawableBalance(Integer tutorId) {
        double orderBalance = getOrderPayoutBalance(tutorId);
        double pendingRequestAmount = getPendingPayoutRequestAmount(tutorId);
        return Math.max(0.0, orderBalance - pendingRequestAmount);
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
        Double available = getWithdrawableBalance(tutorId);
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
        return approvePayout(payoutId, adminNote, "bank_transfer", null, null);
    }

    @Transactional
    public Payout approvePayout(Integer payoutId, String adminNote, String paymentMethod,
                                String providerTransactionId, String providerNote) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy yêu cầu rút tiền"));

        if (payout.getStatus() != Payout.PayoutStatus.PENDING) {
            throw AppException.badRequest("Yêu cầu rút tiền đã được xử lý trước đó");
        }

        // Cập nhật payout
        double orderBalance = getOrderPayoutBalance(payout.getTutorId());
        if (orderBalance + 0.0001 < payout.getAmount()) {
            throw AppException.badRequest("So du cho payout khong du de xu ly yeu cau nay");
        }

        String normalizedMethod = paymentMethod != null && !paymentMethod.isBlank()
                ? paymentMethod.trim()
                : "bank_transfer";

        if ("vnpay_transfer".equalsIgnoreCase(normalizedMethod)
                && (providerTransactionId == null || providerTransactionId.isBlank())) {
            throw AppException.badRequest("Vui long nhap ma giao dich VNPAY khi xac nhan chuyen tien");
        }

        payout.setStatus(Payout.PayoutStatus.COMPLETED);
        payout.setCompletedAt(new Date());
        payout.setNote(adminNote != null ? adminNote : payout.getNote());
        payout.setPaymentMethod(normalizedMethod);
        payout.setProviderTransactionId(providerTransactionId != null ? providerTransactionId.trim() : null);
        payout.setProviderNote(providerNote);
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
            double orderRemaining = getTutorPayoutRemainingAmount(order);
            if (orderRemaining <= 0) {
                order.setTutorPayoutStatus(Order.TutorPayoutStatus.PAID);
                order.setTutorPayoutAt(new Date());
                orderRepository.save(order);
                continue;
            }

            double paidForOrder = Math.min(remaining, orderRemaining);
            double newPaidAmount = getTutorPayoutPaidAmount(order) + paidForOrder;
            order.setTutorPayoutPaidAmount(newPaidAmount);

            if (newPaidAmount + 0.0001 >= getTutorEarning(order)) {
                order.setTutorPayoutStatus(Order.TutorPayoutStatus.PAID);
                order.setTutorPayoutAt(new Date());
            } else {
                order.setTutorPayoutStatus(Order.TutorPayoutStatus.PENDING);
            }

            orderRepository.save(order);
            remaining -= paidForOrder;
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
