package com.simpla.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "chat_history")
public class ChatHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(columnDefinition = "TEXT")
    private String response;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    // Getters and setters omitted for brevity
} 