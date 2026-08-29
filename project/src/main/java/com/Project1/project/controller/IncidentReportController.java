package com.Project1.project.controller;

import com.Project1.project.dto.IncidentDtos.*;
import com.Project1.project.service.IncidentReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/incidents")
@CrossOrigin(origins = "*")
public class IncidentReportController {

    private final IncidentReportService incidentReportService;

    public IncidentReportController(IncidentReportService incidentReportService) {
        this.incidentReportService = incidentReportService;
    }

    @GetMapping("/recent")
    public ResponseEntity<List<IncidentReportDto>> getRecentIncidents() {
        return ResponseEntity.ok(incidentReportService.getRecentIncidents());
    }

    @GetMapping("/pending-queue")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISASTER_OFFICER')")
    public ResponseEntity<List<IncidentReportDto>> getPendingQueue() {
        return ResponseEntity.ok(incidentReportService.getPendingQueue());
    }

    @PostMapping("/report")
    public ResponseEntity<IncidentReportDto> reportIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(incidentReportService.createIncident(request, username));
    }

    @PostMapping("/batch-sync")
    public ResponseEntity<List<IncidentReportDto>> batchSync(
            @RequestBody BatchSyncRequest request,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(incidentReportService.batchSyncOffline(request, username));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISASTER_OFFICER')")
    public ResponseEntity<IncidentReportDto> verifyIncident(
            @PathVariable String id,
            @Valid @RequestBody VerifyIncidentRequest request,
            Authentication authentication
    ) {
        String officerName = authentication != null ? authentication.getName() : "Command Officer";
        return ResponseEntity.ok(incidentReportService.verifyIncident(id, request, officerName));
    }
}
