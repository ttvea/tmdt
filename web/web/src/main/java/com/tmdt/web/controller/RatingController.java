package com.tmdt.web.controller;

import com.tmdt.web.dto.request.CreateRatingRequest;
import com.tmdt.web.dto.request.UpdateRatingRequest;
import com.tmdt.web.repository.UserRep;
import com.tmdt.web.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;
    private final UserRep userRep;

    @PostMapping
    public ResponseEntity<?> createRating(
            @RequestBody CreateRatingRequest request,
            @AuthenticationPrincipal User springUser
    ) {

        String email = springUser.getUsername();

        com.tmdt.web.entity.User student =
                userRep.findByEmail(email)
                        .orElseThrow();

        return ResponseEntity.ok(
                ratingService.createRating(
                        student.getId(),
                        request
                )
        );
    }

    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<?> getRatings(
            @PathVariable Integer tutorId
    ) {
        return ResponseEntity.ok(
                ratingService.getTutorRatings(
                        tutorId
                )
        );
    }

    @GetMapping("/tutor/{tutorId}/average")
    public ResponseEntity<?> getAverage(
            @PathVariable Integer tutorId
    ) {
        return ResponseEntity.ok(
                ratingService.getAverageRating(
                        tutorId
                )
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyRatings(
            @AuthenticationPrincipal User springUser
    ) {
        String email = springUser.getUsername();
        com.tmdt.web.entity.User user =
                userRep.findByEmail(email)
                        .orElseThrow();

        return ResponseEntity.ok(ratingService.getStudentRatings(user.getId()));
    }

    @PutMapping("/{ratingId}")
    public ResponseEntity<?> updateRating(
            @PathVariable Long ratingId,
            @RequestBody UpdateRatingRequest request,
            @AuthenticationPrincipal User springUser
    ) {

        String email = springUser.getUsername();

        com.tmdt.web.entity.User user =
                userRep.findByEmail(email)
                        .orElseThrow();

        return ResponseEntity.ok(ratingService.updateRating(
                ratingId,
                user.getId(),
                request
        ));
    }
    @DeleteMapping("/{ratingId}")
    public ResponseEntity<?> deleteRating(
            @PathVariable Integer ratingId,
            @AuthenticationPrincipal User springUser
    ) {
        try {

            String email = springUser.getUsername();

            com.tmdt.web.entity.User user =
                    userRep.findByEmail(email)
                            .orElseThrow();

            ratingService.deleteRating(
                    ratingId,
                    user.getId()
            );

            return ResponseEntity.ok("Đã xóa đánh giá");

        } catch (Exception e) {
            e.printStackTrace(); // QUAN TRỌNG
            return ResponseEntity.internalServerError()
                    .body(e.getMessage());
        }
    }
}
