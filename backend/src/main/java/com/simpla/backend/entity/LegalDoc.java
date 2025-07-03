package com.simpla.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "legal_docs")
public class LegalDoc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column
    private LocalDate date;

    @Column
    private String source;

    @Column(unique = true)
    private String externalId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // Getters and setters omitted for brevity
} 