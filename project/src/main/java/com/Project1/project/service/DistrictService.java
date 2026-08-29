package com.Project1.project.service;

import com.Project1.project.dto.DistrictDto;
import com.Project1.project.entity.District;
import com.Project1.project.repository.DistrictRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DistrictService {

    private final DistrictRepository districtRepository;

    public DistrictService(DistrictRepository districtRepository) {
        this.districtRepository = districtRepository;
    }

    public List<DistrictDto> getAllDistricts() {
        return districtRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<DistrictDto> getDistrictsByState(String state) {
        return districtRepository.findByState(state)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public DistrictDto updateConnectivityStatus(String id, String status, Double criticalityScore) {
        District district = districtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("District not found: " + id));

        if (status != null) district.setConnectivityStatus(status);
        if (criticalityScore != null) district.setCriticalityScore(criticalityScore);

        District saved = districtRepository.save(district);
        return mapToDto(saved);
    }

    private DistrictDto mapToDto(District district) {
        return new DistrictDto(
                district.getId(),
                district.getName(),
                district.getState(),
                district.getHqLatitude(),
                district.getHqLongitude(),
                district.getConnectivityStatus(),
                district.getCriticalityScore(),
                district.getActiveIncidentsCount(),
                district.getUpdatedAt() != null ? district.getUpdatedAt().toString() : null
        );
    }
}
