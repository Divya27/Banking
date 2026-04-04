package com.divya.bankingsystem.service;

import com.divya.bankingsystem.dto.request.LoginRequest;
import com.divya.bankingsystem.dto.request.RegisterRequest;
import com.divya.bankingsystem.dto.response.AuthResponse;
import com.divya.bankingsystem.entity.User;
import com.divya.bankingsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public void register(RegisterRequest request) {

        // check if email already exists
//        if(userRepository.findByEmail(request.getEmail()).isPresent()) {
//            throw new RuntimeException("Email already registered.");
//        }
        if(userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered.");
        }

        // check if username is already in use
        if(userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists.");
        }

        User user = new User();

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {

        // check if user is registered
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User is not registered."));

        // check if password is correct
        if(!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password.");
        }

        // generate token
        String token = jwtService.generateToken(user);

        return new AuthResponse(token);

    }
}
