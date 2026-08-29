package com.Project1.project.controller;

import com.Project1.project.dto.DistrictDto;
import com.Project1.project.service.DistrictService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/districts")
@CrossOrigin(origins = "*")
public class DistrictController {

    private final DistrictService districtService;

    public DistrictController(DistrictService districtService) {
        this.districtService = districtService;
    }

    @GetMapping
    public ResponseEntity<List<DistrictDto>> getAllDistricts() {
        return ResponseEntity.ok(districtService.getAllDistricts());
    }

    @GetMapping("/state/{state}")
    public ResponseEntity<List<DistrictDto>> getDistrictsByState(@PathVariable String state) {
        return ResponseEntity.ok(districtService.getDistrictsByState(state));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<DistrictDto> updateConnectivity(
            @PathVariable String id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double criticalityScore
    ) {
        return ResponseEntity.ok(districtService.updateConnectivityStatus(id, status, criticalityScore));
    }
}
