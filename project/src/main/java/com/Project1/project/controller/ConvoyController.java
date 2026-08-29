package com.Project1.project.controller;

import com.Project1.project.dto.ConvoyDtos.*;
import com.Project1.project.service.ConvoyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/convoys")
@CrossOrigin(origins = "*")
public class ConvoyController {

    private final ConvoyService convoyService;

    public ConvoyController(ConvoyService convoyService) {
        this.convoyService = convoyService;
    }

    @GetMapping
    public ResponseEntity<List<ConvoyDto>> getAllConvoys() {
        return ResponseEntity.ok(convoyService.getAllConvoys());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ConvoyDto>> getActiveConvoys() {
        return ResponseEntity.ok(convoyService.getActiveConvoys());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TRANSPORTER')")
    public ResponseEntity<ConvoyDto> createConvoy(@Valid @RequestBody CreateConvoyRequest request) {
        return ResponseEntity.ok(convoyService.createConvoy(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRANSPORTER')")
    public ResponseEntity<Map<String, Object>> deleteConvoy(@PathVariable("id") String id) {
        convoyService.deleteConvoy(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Convoy deleted successfully", "id", id));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'TRANSPORTER')")
    public ResponseEntity<ConvoyDto> completeConvoy(@PathVariable("id") String id) {
        return ResponseEntity.ok(convoyService.completeConvoy(id));
    }

    @PostMapping("/telemetry")
    public ResponseEntity<ConvoyDto> updateTelemetry(@Valid @RequestBody TelemetryPingRequest ping) {
        return ResponseEntity.ok(convoyService.updateTelemetry(ping));
    }
}
