package com.Project1.project.repository;

import com.Project1.project.entity.RoadSegment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoadSegmentRepository extends JpaRepository<RoadSegment, String> {

    List<RoadSegment> findByHighwayCode(String highwayCode);

    List<RoadSegment> findByCurrentStatus(String currentStatus);

    @Query(value = "SELECT * FROM road_segments WHERE current_risk_score >= :threshold ORDER BY current_risk_score DESC", nativeQuery = true)
    List<RoadSegment> findHighRiskSegments(@Param("threshold") Double threshold);

    @Query(value = "SELECT * FROM road_segments WHERE start_hub = :origin OR end_hub = :destination", nativeQuery = true)
    List<RoadSegment> findConnectingSegments(@Param("origin") String origin, @Param("destination") String destination);

    @Query(value = "SELECT * FROM road_segments ORDER BY current_risk_score DESC", nativeQuery = true)
    List<RoadSegment> findAllOrderedByRisk();
}
