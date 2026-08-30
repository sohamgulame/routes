package com.Project1.project.repository;

import com.Project1.project.entity.IncidentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, String> {

    List<IncidentReport> findByVerificationStatus(String verificationStatus);

    List<IncidentReport> findByRoadSegment_Id(String roadSegmentId);

    @Query(value = "SELECT * FROM incident_reports ORDER BY created_at DESC LIMIT 50", nativeQuery = true)
    List<IncidentReport> findRecentIncidents();

    @Query(value = "SELECT * FROM incident_reports WHERE verification_status = 'PENDING' ORDER BY created_at ASC", nativeQuery = true)
    List<IncidentReport> findPendingVerificationQueue();

    @Query(value = "SELECT COUNT(*) FROM incident_reports WHERE ST_Distance(location_geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) < 0.03 AND created_at >= :sinceTime", nativeQuery = true)
    int countRecentReportsNear(@org.springframework.data.repository.query.Param("lat") Double lat, @org.springframework.data.repository.query.Param("lng") Double lng, @org.springframework.data.repository.query.Param("sinceTime") java.time.LocalDateTime sinceTime);
}
