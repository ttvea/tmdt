package com.tmdt.web.repository;

import com.tmdt.web.entity.DisputeNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisputeNoteRep extends JpaRepository<DisputeNote, Long> {
    List<DisputeNote> findByDisputeIdOrderByCreatedAtDesc(Long disputeId);
}
