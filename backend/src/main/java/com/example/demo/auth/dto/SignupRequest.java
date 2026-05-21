package com.example.demo.auth.dto;

public record SignupRequest(
        String email,
        String password
) {
}