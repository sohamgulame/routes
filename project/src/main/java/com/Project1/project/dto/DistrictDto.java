package com.Project1.project.dto;

public record DistrictDto(
        String id,
        String name,
        String state,
        Double hqLatitude,
        Double hqLongitude,
        String connectivityStatus,
        Double criticalityScore,
        Integer activeIncidentsCount,
        String updatedAt
) {}
