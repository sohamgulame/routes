package com.Project1.project.controller;

import com.Project1.project.dto.AlertDtos.*;
import com.Project1.project.service.AlertNotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
@CrossOrigin(origins = "*")
public class AlertNotificationController {

    private final AlertNotificationService alertService;

    public AlertNotificationController(AlertNotificationService alertService) {
        this.alertService = alertService;
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISASTER_OFFICER')")
    public ResponseEntity<AlertDispatchResultDto> broadcastAlert(
            @Valid @RequestBody BroadcastAlertRequest request,
            Authentication auth
    ) {
        String officer = auth != null ? auth.getName() : "State Nodal Officer";
        return ResponseEntity.ok(alertService.broadcastEmergencyAlert(request, officer));
    }

    @GetMapping("/history")
    public ResponseEntity<List<AlertDispatchResultDto>> getAlertHistory() {
        return ResponseEntity.ok(alertService.getAlertHistory());
    }
}
