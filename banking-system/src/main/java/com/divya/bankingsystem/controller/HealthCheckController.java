package com.divya.bankingsystem.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthCheckController {

    @GetMapping("/api/healthcheck")
    public String healthCheck() {
        return "Hello! Banking App is running!";
    }

}
