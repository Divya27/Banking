package com.divya.bankingsystem.repository;

import com.divya.bankingsystem.entity.User;
import jakarta.persistence.Column;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String emailId);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);
}
