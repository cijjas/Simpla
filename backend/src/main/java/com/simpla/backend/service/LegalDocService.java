package com.simpla.backend.service;

import com.simpla.backend.entity.LegalDoc;
import com.simpla.backend.repository.LegalDocRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LegalDocService {
    private final LegalDocRepository legalDocRepository;

    @Autowired
    public LegalDocService(LegalDocRepository legalDocRepository) {
        this.legalDocRepository = legalDocRepository;
    }

    public LegalDoc save(LegalDoc doc) {
        return legalDocRepository.save(doc);
    }

    public Optional<LegalDoc> findById(Long id) {
        return legalDocRepository.findById(id);
    }

    public Optional<LegalDoc> findByExternalId(String externalId) {
        return legalDocRepository.findByExternalId(externalId);
    }

    public List<LegalDoc> searchByTitle(String title) {
        return legalDocRepository.findAll().stream()
                .filter(doc -> doc.getTitle().toLowerCase().contains(title.toLowerCase()))
                .toList();
    }

    public List<LegalDoc> findAll() {
        return legalDocRepository.findAll();
    }
} 