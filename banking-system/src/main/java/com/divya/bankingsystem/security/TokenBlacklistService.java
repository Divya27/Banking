package com.divya.bankingsystem.security;

import org.springframework.stereotype.Service;
import java.util.HashSet;
import java.util.Set;

@Service
public class TokenBlacklistService {

    // In-memory blacklist — stores invalidated tokens
    // For production: use Redis instead
    private final Set<String> blacklistedTokens = new HashSet<>();

    public void blacklist(String token) {
        blacklistedTokens.add(token);
    }

    public boolean isBlacklisted(String token) {
        return blacklistedTokens.contains(token);
    }
}