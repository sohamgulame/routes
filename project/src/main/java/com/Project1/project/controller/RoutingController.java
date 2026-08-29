package com.Project1.project.controller;

import com.Project1.project.dto.RoutingDtos.RouteCalculationRequest;
import com.Project1.project.dto.RoutingDtos.RouteCalculationResponse;
import com.Project1.project.service.RoutingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/routes")
@CrossOrigin(origins = "*")
public class RoutingController {

    private final RoutingService routingService;

    public RoutingController(RoutingService routingService) {
        this.routingService = routingService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<RouteCalculationResponse> calculateRoutes(@Valid @RequestBody RouteCalculationRequest request) {
        return ResponseEntity.ok(routingService.calculateOptimalRoutes(request));
    }
}
