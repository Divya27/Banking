package com.divya.bankingsystem.controller;

import com.divya.bankingsystem.entity.User;
import com.divya.bankingsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // GET /api/user/me
    // Spring Security gives us the logged in user's email via Authentication
    // We use it to fetch full user details from DB
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {

        // Get email of logged in user from Security context
        // Spring Security sets this after JWT filter runs
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName(); // returns email (JWT sub field)

        // Fetch user from DB
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Return only safe fields — never return password
        return ResponseEntity.ok(new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getCreatedAt()
        ));
    }

    // Simple response record — no need for a separate DTO file
    record UserProfileResponse(
            Long id,
            String username,
            String email,
            java.time.LocalDateTime createdAt
    ) {}
}