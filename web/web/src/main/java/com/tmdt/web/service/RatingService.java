package com.tmdt.web.service;

import com.tmdt.web.dto.request.CreateRatingRequest;
import com.tmdt.web.dto.request.UpdateRatingRequest;
import com.tmdt.web.dto.response.RatingResponse;
import com.tmdt.web.entity.Rating;
import com.tmdt.web.entity.User;
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

    public RatingResponse createRating(
            Integer studentId,
            CreateRatingRequest request
    ) {

        if (request.getStars() < 1
                || request.getStars() > 5) {
            throw new RuntimeException(
                    "Số sao phải từ 1 đến 5"
            );
        }

        if (ratingRepository.existsByStudentIdAndTutorId(
                studentId,
                request.getTutorId())) {

            throw new RuntimeException(
                    "Bạn đã đánh giá gia sư này rồi"
            );
        }

        User student = userRep.findById(studentId)
                .orElseThrow();

        User tutor = userRep.findById(request.getTutorId())
                .orElseThrow();

        Rating rating = Rating.builder()
                .student(student)
                .tutor(tutor)
                .stars(request.getStars())
                .comment(request.getComment())
                .build();

        ratingRepository.save(rating);

        return RatingResponse.builder()
                .id(rating.getId())
                .studentId(student.getId())
                .avatar(student.getAvatar())
                .nameStudent(student.getFullName())
                .tutorId(tutor.getId())
                .stars(rating.getStars())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }

    public List<RatingResponse> getTutorRatings(Integer tutorId) {

        List<Rating> ratings =
                ratingRepository.findByTutorIdOrderByCreatedAtDesc(tutorId);

        return ratings.stream()
                .map(r -> RatingResponse.builder()
                        .id(r.getId())
                        .studentId(r.getStudent().getId())
                        .nameStudent(r.getStudent().getFullName())
                        .avatar(r.getStudent().getAvatar())
                        .tutorId(r.getTutor().getId())
                        .stars(r.getStars())
                        .comment(r.getComment())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();
    }

    public Double getAverageRating(
            Integer tutorId
    ) {
        return ratingRepository.getAverageRating(
                tutorId
        );
    }
    @Transactional
    public Rating updateRating(
            Long ratingId,
            Integer studentId,
            UpdateRatingRequest request
    ) {

        Rating rating = ratingRepository
                .findById(ratingId)
                .orElseThrow(
                        () -> new RuntimeException("Rating not found")
                );

        if (!rating.getStudent().getId().equals(studentId)) {
            throw new RuntimeException(
                    "Bạn không có quyền sửa đánh giá này"
            );
        }

        rating.setStars(request.getStars());
        rating.setComment(request.getComment());

        return ratingRepository.save(rating);
    }
    @Transactional
    public void deleteRating(
            Integer ratingId,
            Integer currentUserId
    ) {
        System.out.println("ratingId = " + ratingId);
        System.out.println("currentUserId = " + currentUserId);

        Rating rating = ratingRepository.findById(Long.valueOf(ratingId))
                .orElseThrow();

        System.out.println("rating found");

        System.out.println(
                "rating student = " +
                        rating.getStudent().getId()
        );

        if (!rating.getStudent().getId().equals(currentUserId)) {
            System.out.println("NO PERMISSION");
            throw new RuntimeException("Không có quyền xóa");
        }

        System.out.println("BEFORE DELETE");

        ratingRepository.delete(rating);

        System.out.println("AFTER DELETE");
    }
}