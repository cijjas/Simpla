package com.simpla.backend.controller;

import com.simpla.backend.entity.LegalDoc;
import com.simpla.backend.service.LegalDocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/docs")
public class LegalDocController {
    private final LegalDocService legalDocService;

    @Autowired
    public LegalDocController(LegalDocService legalDocService) {
        this.legalDocService = legalDocService;
    }

    @GetMapping
    public List<LegalDoc> getAll() {
        return legalDocService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<LegalDoc> doc = legalDocService.findById(id);
        return doc.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<LegalDoc> searchByTitle(@RequestParam String title) {
        return legalDocService.searchByTitle(title);
    }
} 