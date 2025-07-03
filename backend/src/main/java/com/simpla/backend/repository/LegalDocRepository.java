package com.simpla.backend.repository;

import com.simpla.backend.entity.LegalDoc;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LegalDocRepository extends JpaRepository<LegalDoc, Long> {
    Optional<LegalDoc> findByExternalId(String externalId);
} 