package com.Project1.project.service;

import com.Project1.project.dto.AuthDtos.*;
import com.Project1.project.entity.User;
import com.Project1.project.repository.UserRepository;
import com.Project1.project.security.JwtUtils;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Value("${app.security.code.admin:MDONER-ADMIN-2026}")
    private String adminSecurityCode;

    @Value("${app.security.code.disaster-officer:SDMA-OFFICER-7788}")
    private String disasterOfficerSecurityCode;

    @Value("${app.security.code.field-engineer:BRO-FIELD-5521}")
    private String fieldEngineerSecurityCode;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils, AuthenticationManager authenticationManager, UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    @PostConstruct
    public void initDefaultAccounts() {
        seedAccountIfMissing("demo_jury", "password123", "Hackathon Grand Jury (All-Access)", "jury@sih.gov.in", "+919999999999", "ROLE_ADMIN", "North East Region", "Regional HQ");
        seedAccountIfMissing("admin", "password123", "MDoNER State Command Admin", "admin@mdoner.gov.in", "+919876543210", "ROLE_ADMIN", "Assam", "Kamrup Metropolitan");
        seedAccountIfMissing("disaster_nodal", "password123", "SDMA Disaster Nodal Officer", "nodal@meghalaya.gov.in", "+919876543211", "ROLE_DISASTER_OFFICER", "Meghalaya", "East Khasi Hills");
        seedAccountIfMissing("disaster_officer", "password123", "SDMA Disaster Nodal Officer", "disaster@sdma.gov.in", "+919876543211", "ROLE_DISASTER_OFFICER", "Meghalaya", "East Khasi Hills");
        seedAccountIfMissing("driver_ramesh", "password123", "Ramesh Sharma (Fleet Lead)", "ramesh@nertrans.com", "+919876543212", "ROLE_TRANSPORTER", "Assam", "Cachar");
        seedAccountIfMissing("transporter", "password123", "Bikash Ch. Hazarika (Fleet Lead)", "fleet@nertrans.com", "+919876543212", "ROLE_TRANSPORTER", "Assam", "Cachar");
        seedAccountIfMissing("pwd_inspector", "password123", "Inspector Tashi Dorjee (BRO)", "tashi@pwd.gov.in", "+919876543213", "ROLE_FIELD_ENGINEER", "Sikkim", "East Sikkim");
        seedAccountIfMissing("field_worker", "password123", "Er. Tenzing Norbu (BRO)", "tenzing@bro.gov.in", "+919876543213", "ROLE_FIELD_ENGINEER", "Sikkim", "East Sikkim");
    }

    private void seedAccountIfMissing(String username, String rawPassword, String fullName, String email, String phone, String role, String state, String district) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            user = new User(
                    UUID.randomUUID().toString(),
                    username,
                    passwordEncoder.encode(rawPassword),
                    fullName,
                    email,
                    phone,
                    role,
                    state,
                    district,
                    true
            );
            userRepository.save(user);
        } else {
            // Guarantee password matches current BCrypt encoding
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            user.setFullName(fullName);
            userRepository.save(user);
        }
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new RuntimeException("User not found: " + request.username()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtils.generateToken(userDetails, user.getRole(), user.getFullName());

        return new LoginResponse(
                token,
                "Bearer",
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole(),
                user.getState(),
                user.getDistrict()
        );
    }

    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new RuntimeException("Username already taken: " + request.username());
        }

        String targetRole = request.role() != null ? request.role().trim().toUpperCase() : "ROLE_CITIZEN";
        if (!targetRole.startsWith("ROLE_")) {
            targetRole = "ROLE_" + targetRole;
        }

        // 1. Role-Based Verification & Secret Code Checking
        if ("ROLE_ADMIN".equals(targetRole)) {
            if (request.roleSecurityCode() == null || !request.roleSecurityCode().trim().equals(adminSecurityCode)) {
                throw new RuntimeException("Invalid Departmental Authorization Code for State Command Admin.");
            }
        } else if ("ROLE_DISASTER_OFFICER".equals(targetRole)) {
            if (request.roleSecurityCode() == null || !request.roleSecurityCode().trim().equals(disasterOfficerSecurityCode)) {
                throw new RuntimeException("Invalid SDMA / NDRF Service Verification PIN for Disaster Officer.");
            }
        } else if ("ROLE_FIELD_ENGINEER".equals(targetRole)) {
            if (request.roleSecurityCode() == null || !request.roleSecurityCode().trim().equals(fieldEngineerSecurityCode)) {
                throw new RuntimeException("Invalid Border Roads / PWD Engineer Badge PIN.");
            }
        } else if ("ROLE_TRANSPORTER".equals(targetRole)) {
            if (request.companyName() == null || request.companyName().trim().isEmpty()) {
                throw new RuntimeException("Transport & Logistics Company Name is required for Transporters.");
            }
            if (request.fleetLicenseOrGstin() == null || request.fleetLicenseOrGstin().trim().isEmpty()) {
                throw new RuntimeException("Valid GSTIN or VAHAN Fleet Operator License No. is required.");
            }
        }

        String effectiveFullName = request.fullName();
        if ("ROLE_TRANSPORTER".equals(targetRole) && request.companyName() != null) {
            effectiveFullName += " (" + request.companyName().trim() + ")";
        }

        User user = new User(
                UUID.randomUUID().toString(),
                request.username(),
                passwordEncoder.encode(request.password()),
                effectiveFullName,
                request.email(),
                request.phone(),
                targetRole,
                request.state() != null ? request.state() : "Assam",
                request.district() != null ? request.district() : "Kamrup Metropolitan",
                true
        );

        User saved = userRepository.save(user);
        return mapToDto(saved);
    }

    private UserDto mapToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getState(),
                user.getDistrict(),
                user.getIsActive()
        );
    }
}
