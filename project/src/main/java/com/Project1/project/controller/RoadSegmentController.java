package com.Project1.project.controller;

import com.Project1.project.dto.RoadSegmentDto;
import com.Project1.project.service.RoadSegmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/road-segments")
@CrossOrigin(origins = "*")
public class RoadSegmentController {

    private final RoadSegmentService roadSegmentService;

    public RoadSegmentController(RoadSegmentService roadSegmentService) {
        this.roadSegmentService = roadSegmentService;
    }

    @GetMapping
    public ResponseEntity<List<RoadSegmentDto>> getAllSegments() {
        return ResponseEntity.ok(roadSegmentService.getAllSegments());
    }

    @GetMapping("/high-risk")
    public ResponseEntity<List<RoadSegmentDto>> getHighRiskSegments(@RequestParam(defaultValue = "0.5") Double threshold) {
        return ResponseEntity.ok(roadSegmentService.getHighRiskSegments(threshold));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoadSegmentDto> getSegmentById(@PathVariable String id) {
        return ResponseEntity.ok(roadSegmentService.getSegmentById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<RoadSegmentDto> updateStatus(
            @PathVariable String id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double riskScore,
            @RequestParam(required = false) String reason
    ) {
        return ResponseEntity.ok(roadSegmentService.updateSegmentStatus(id, status, riskScore, reason));
    }

    @PostMapping("/recalculate-live-ai")
    public ResponseEntity<List<RoadSegmentDto>> recalculateLiveAi() {
        return ResponseEntity.ok(roadSegmentService.recalculateAllCorridorsLive());
    }
}
