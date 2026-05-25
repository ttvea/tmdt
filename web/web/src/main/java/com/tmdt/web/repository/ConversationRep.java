package com.tmdt.web.repository;

import com.tmdt.web.entity.Conversation;
import com.tmdt.web.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRep
        extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByStudentAndTutor(
            User student,
            User tutor
    );
    List<Conversation> findByStudent_IdOrTutor_Id(
            Integer studentId,
            Integer tutorId
    );
}