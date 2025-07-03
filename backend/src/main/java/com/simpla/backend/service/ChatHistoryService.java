package com.simpla.backend.service;

import com.simpla.backend.entity.ChatHistory;
import com.simpla.backend.repository.ChatHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatHistoryService {
    private final ChatHistoryRepository chatHistoryRepository;

    @Autowired
    public ChatHistoryService(ChatHistoryRepository chatHistoryRepository) {
        this.chatHistoryRepository = chatHistoryRepository;
    }

    public ChatHistory save(ChatHistory chatHistory) {
        return chatHistoryRepository.save(chatHistory);
    }

    public List<ChatHistory> findByUserId(Long userId) {
        return chatHistoryRepository.findByUserId(userId);
    }

    public List<ChatHistory> findAll() {
        return chatHistoryRepository.findAll();
    }
} 