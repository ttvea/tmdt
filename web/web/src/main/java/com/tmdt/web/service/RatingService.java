package com.tmdt.web.service;

import com.tmdt.web.dto.request.CreateRatingRequest;
import com.tmdt.web.dto.request.UpdateRatingRequest;
import com.tmdt.web.dto.response.RatingResponse;
import com.tmdt.web.entity.Enrollment;
import com.tmdt.web.entity.Rating;
import com.tmdt.web.entity.TutorClass;
import com.tmdt.web.entity.User;
import com.tmdt.web.enums.ClassStatus;
import com.tmdt.web.enums.EnrollmentStatus;
import com.tmdt.web.repository.EnrollmentRep;
import com.tmdt.web.repository.RatingRep;
import com.tmdt.web.repository.UserRep;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRep ratingRepository;
    private final UserRep userRep;
    private final EnrollmentRep enrollmentRep;

    @Transactional
    public RatingResponse createRating(Integer studentId, CreateRatingRequest request) {
        validateStars(request.getStars());

        User student = userRep.findById(studentId).orElseThrow();
        if (request.getClassId() == null && request.getEnrollmentId() == null) {
            return createTutorRating(student, request);
        }

        Enrollment enrollment = resolvePaidEnrollment(studentId.longValue(), request);
        TutorClass classEntity = enrollment.getClassEntity();
        User tutor = userRep.findById(classEntity.getTutorId().intValue()).orElseThrow();

        if (ratingRepository.existsByStudentIdAndEnrollmentId(studentId, enrollment.getId())
                || ratingRepository.existsByStudentIdAndClassEntityId(studentId, classEntity.getId())) {
            throw new RuntimeException("Bạn đã đánh giá lớp học này rồi");
        }

        Rating rating = Rating.builder()
                .student(student)
                .tutor(tutor)
                .classEntity(classEntity)
                .enrollment(enrollment)
                .stars(request.getStars())
                .comment(request.getComment())
                .build();

        return toResponse(ratingRepository.save(rating));
    }

    private RatingResponse createTutorRating(User student, CreateRatingRequest request) {
        if (request.getTutorId() == null) {
            throw new RuntimeException("Vui lòng chọn gia sư cần đánh giá");
        }

        if (ratingRepository.existsByStudentIdAndTutorId(student.getId(), request.getTutorId())) {
            throw new RuntimeException("Bạn đã đánh giá gia sư này rồi");
        }

        User tutor = userRep.findById(request.getTutorId()).orElseThrow();
        boolean hasPaidEnrollmentWithTutor = enrollmentRep.existsByStudentIdAndTutorIdAndStatus(
                student.getId().longValue(),
                tutor.getId().longValue(),
                EnrollmentStatus.PAID
        );
        if (!hasPaidEnrollmentWithTutor) {
            throw new RuntimeException("Chi hoc vien da hoc va thanh toan lop cua gia su nay moi duoc danh gia");
        }

        Rating rating = Rating.builder()
                .student(student)
                .tutor(tutor)
                .stars(request.getStars())
                .comment(request.getComment())
                .build();

        return toResponse(ratingRepository.save(rating));
    }

    public List<RatingResponse> getTutorRatings(Integer tutorId) {
        return ratingRepository.findByTutorIdOrderByCreatedAtDesc(tutorId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RatingResponse> getStudentRatings(Integer studentId) {
        return ratingRepository.findByStudentIdOrderByCreatedAtDesc(studentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public Double getAverageRating(Integer tutorId) {
        Double average = ratingRepository.getAverageRating(tutorId);
        return average != null ? average : 0.0;
    }

    @Transactional
    public RatingResponse updateRating(Long ratingId, Integer studentId, UpdateRatingRequest request) {
        validateStars(request.getStars());

        Rating rating = ratingRepository
                .findById(ratingId)
                .orElseThrow(() -> new RuntimeException("Rating not found"));

        if (!rating.getStudent().getId().equals(studentId)) {
            throw new RuntimeException("Bạn không có quyền sửa đánh giá này");
        }

        rating.setStars(request.getStars());
        rating.setComment(request.getComment());

        return toResponse(ratingRepository.save(rating));
    }

    @Transactional
    public void deleteRating(Integer ratingId, Integer currentUserId) {
        Rating rating = ratingRepository.findById(Long.valueOf(ratingId)).orElseThrow();

        if (!rating.getStudent().getId().equals(currentUserId)) {
            throw new RuntimeException("Không có quyền xóa");
        }

        ratingRepository.delete(rating);
    }

    private Enrollment resolvePaidEnrollment(Long studentId, CreateRatingRequest request) {
        Enrollment enrollment;
        if (request.getEnrollmentId() != null) {
            enrollment = enrollmentRep.findByIdAndStudentId(request.getEnrollmentId(), studentId).orElseThrow(
                    () -> new RuntimeException("Không tìm thấy lượt đăng ký lớp học")
            );
        } else if (request.getClassId() != null) {
            enrollment = enrollmentRep.findByClassEntityIdAndStudentId(request.getClassId(), studentId).orElseThrow(
                    () -> new RuntimeException("Bạn chưa đăng ký lớp học này")
            );
        } else {
            throw new RuntimeException("Vui lòng chọn lớp học cần đánh giá");
        }

        if (enrollment.getStatus() != EnrollmentStatus.PAID) {
            throw new RuntimeException("Chỉ có thể đánh giá lớp học đã thanh toán");
        }

        TutorClass classEntity = enrollment.getClassEntity();
        if (classEntity == null || classEntity.getStatus() != ClassStatus.COMPLETED) {
            throw new RuntimeException("Chi co the danh gia lop hoc sau khi lop da hoan thanh");
        }

        return enrollment;
    }

    private void validateStars(Integer stars) {
        if (stars == null || stars < 1 || stars > 5) {
            throw new RuntimeException("Số sao phải từ 1 đến 5");
        }
    }

    private RatingResponse toResponse(Rating rating) {
        User student = rating.getStudent();
        User tutor = rating.getTutor();
        TutorClass classEntity = rating.getClassEntity();
        Enrollment enrollment = rating.getEnrollment();

        return RatingResponse.builder()
                .id(rating.getId())
                .studentId(student != null ? student.getId() : null)
                .avatar(student != null ? student.getAvatar() : null)
                .nameStudent(student != null ? student.getFullName() : null)
                .tutorId(tutor != null ? tutor.getId() : null)
                .classId(classEntity != null ? classEntity.getId() : null)
                .classTitle(classEntity != null ? classEntity.getTitle() : null)
                .enrollmentId(enrollment != null ? enrollment.getId() : null)
                .stars(rating.getStars())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }
}
