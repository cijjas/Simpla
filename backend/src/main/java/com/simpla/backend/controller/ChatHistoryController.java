package com.simpla.backend.controller;

import com.simpla.backend.entity.ChatHistory;
import com.simpla.backend.service.ChatHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatHistoryController {
    private final ChatHistoryService chatHistoryService;

    @Autowired
    public ChatHistoryController(ChatHistoryService chatHistoryService) {
        this.chatHistoryService = chatHistoryService;
    }

    @GetMapping("/user/{userId}")
    public List<ChatHistory> getByUserId(@PathVariable Long userId) {
        return chatHistoryService.findByUserId(userId);
    }

    @PostMapping
    public ResponseEntity<?> addChat(@RequestBody ChatHistory chatHistory) {
        ChatHistory saved = chatHistoryService.save(chatHistory);
        return ResponseEntity.ok(saved);
    }
} 