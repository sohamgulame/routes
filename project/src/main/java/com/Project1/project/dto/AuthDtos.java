package com.Project1.project.dto;

import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    public record LoginRequest(
            @NotBlank(message = "Username is required") String username,
            @NotBlank(message = "Password is required") String password
    ) {}

    public record LoginResponse(
            String token,
            String tokenType,
            String userId,
            String username,
            String fullName,
            String role,
            String state,
            String district
    ) {}

    public record RegisterRequest(
            @NotBlank String username,
            @NotBlank String password,
            @NotBlank String fullName,
            String email,
            String phone,
            String role,
            String state,
            String district,
            String roleSecurityCode,
            String companyName,
            String fleetLicenseOrGstin
    ) {}

    public record UserDto(
            String id,
            String username,
            String fullName,
            String email,
            String phone,
            String role,
            String state,
            String district,
            Boolean isActive
    ) {}
}
