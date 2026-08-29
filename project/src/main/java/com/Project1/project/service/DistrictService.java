package com.Project1.project.service;

import com.Project1.project.dto.DistrictDto;
import com.Project1.project.entity.District;
import com.Project1.project.entity.IncidentReport;
import com.Project1.project.entity.RoadSegment;
import com.Project1.project.repository.DistrictRepository;
import com.Project1.project.repository.IncidentReportRepository;
import com.Project1.project.repository.RoadSegmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DistrictService {

    private final DistrictRepository districtRepository;
    private final RoadSegmentRepository roadSegmentRepository;
    private final IncidentReportRepository incidentReportRepository;

    public DistrictService(DistrictRepository districtRepository,
                           RoadSegmentRepository roadSegmentRepository,
                           IncidentReportRepository incidentReportRepository) {
        this.districtRepository = districtRepository;
        this.roadSegmentRepository = roadSegmentRepository;
        this.incidentReportRepository = incidentReportRepository;
    }

    @Transactional
    public List<DistrictDto> getAllDistricts() {
        List<District> districts = districtRepository.findAll();
        List<RoadSegment> roadSegments = roadSegmentRepository.findAll();
        List<IncidentReport> activeIncidents = incidentReportRepository.findRecentIncidents();

        for (District district : districts) {
            double baseRisk = 0.05;
            int incidentCount = 0;

            // Check verified active incidents within ~45km radius of district HQ
            if (district.getHqLatitude() != null && district.getHqLongitude() != null) {
                for (IncidentReport inc : activeIncidents) {
                    if ("VERIFIED".equals(inc.getVerificationStatus()) || "PENDING".equals(inc.getVerificationStatus())) {
                        double lat = inc.getLatitude();
                        double lng = inc.getLongitude();
                        double dist = Math.sqrt(Math.pow(lat - district.getHqLatitude(), 2) + Math.pow(lng - district.getHqLongitude(), 2));
                        if (dist < 0.45) { // ~45 km
                            incidentCount++;
                            if ("CRITICAL".equals(inc.getSeverity())) {
                                baseRisk += 0.35;
                            } else if ("MAJOR".equals(inc.getSeverity())) {
                                baseRisk += 0.20;
                            } else {
                                baseRisk += 0.10;
                            }
                        }
                    }
                }
            }

            // Check road segments near or associated with district
            for (RoadSegment road : roadSegments) {
                if (road.getSegmentGeom() != null && road.getSegmentGeom().getCoordinate() != null &&
                    district.getHqLatitude() != null && district.getHqLongitude() != null) {
                    double roadLat = road.getSegmentGeom().getCoordinate().y;
                    double roadLng = road.getSegmentGeom().getCoordinate().x;
                    double dist = Math.sqrt(Math.pow(roadLat - district.getHqLatitude(), 2) + 
                                            Math.pow(roadLng - district.getHqLongitude(), 2));
                    if (dist < 0.6) {
                        if ("BLOCKED".equals(road.getCurrentStatus())) {
                            baseRisk += 0.40;
                        } else if ("CAUTION".equals(road.getCurrentStatus()) || (road.getCurrentRiskScore() != null && road.getCurrentRiskScore() > 0.6)) {
                            baseRisk += 0.20;
                        }
                    }
                }
            }

            // High-gradient regional baselines for mountainous passes
            if (district.getName() != null) {
                if (district.getName().contains("Jaintia") || district.getName().contains("Jowai")) {
                    baseRisk = Math.max(baseRisk, 0.85); // Known high-gradient monsoon pass
                } else if (district.getName().contains("Kohima") || district.getName().contains("Gangtok")) {
                    baseRisk = Math.max(baseRisk, 0.60);
                }
            }

            double finalScore = Math.min(0.98, Math.round(baseRisk * 100.0) / 100.0);
            district.setCriticalityScore(finalScore);
            district.setActiveIncidentsCount(incidentCount);

            if (finalScore >= 0.70) {
                district.setConnectivityStatus("ISOLATED");
            } else if (finalScore >= 0.35) {
                district.setConnectivityStatus("RESTRICTED");
            } else {
                district.setConnectivityStatus("NORMAL");
            }
            districtRepository.save(district);
        }

        return districts.stream().map(this::mapToDto).collect(Collectors.toList());
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
