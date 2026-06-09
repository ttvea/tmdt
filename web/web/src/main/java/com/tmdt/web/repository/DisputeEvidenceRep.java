package com.tmdt.web.repository;

import com.tmdt.web.entity.DisputeEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisputeEvidenceRep extends JpaRepository<DisputeEvidence, Long> {
    List<DisputeEvidence> findByDisputeIdOrderByCreatedAtDesc(Long disputeId);
}
