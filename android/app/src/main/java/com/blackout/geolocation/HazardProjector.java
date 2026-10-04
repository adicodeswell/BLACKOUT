package com.blackout.geolocation;

import com.blackout.geolocation.model.GeoPoint;
import com.blackout.geolocation.model.HazardState;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Projects geographic hazards onto nearby road edges.
 */
public final class HazardProjector {

    /**
     * Applies active hazards to the graph.
     *
     * maxHazardSeverity follows the internal ranking:
     * UNKNOWN=0, LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4.
     */
    public Set<String> project(
            RoadGraph graph,
            Collection<HazardState> hazards,
            boolean avoidHazards,
            int maxHazardSeverity,
            long nowMs
    ) {

        if (graph == null) {
            throw new IllegalArgumentException(
                    "graph is required."
            );
        }

        graph.clearDynamicHazards();

        Set<String> appliedHazards =
                new LinkedHashSet<>();

        if (!avoidHazards || hazards == null) {
            return appliedHazards;
        }

        for (HazardState hazard : hazards) {

            if (!hazard.isActive(nowMs)) {
                continue;
            }

            if (hazard.getSeverityRank()
                    > maxHazardSeverity) {
                continue;
            }

            for (GraphEdge edge : graph.getEdges()) {

                GraphNode from =
                        graph.getNode(
                                edge.getFromNodeId()
                        );

                GraphNode to =
                        graph.getNode(
                                edge.getToNodeId()
                        );

                double distance =
                        pointToSegmentDistance(
                                hazard.getCenter(),
                                from.getPoint(),
                                to.getPoint()
                        );

                if (distance
                        <= hazard.getRadiusM()) {

                    edge.applyHazard(
                            hazard.getHazardId(),
                            hazard.getPenaltyM(),
                            hazard.blocksRoad()
                    );

                    appliedHazards.add(
                            hazard.getHazardId()
                    );
                }
            }
        }

        return appliedHazards;
    }

    /**
     * Approximates distance from a geographic point to a
     * short road segment using a local equirectangular projection.
     */
    private double pointToSegmentDistance(
            GeoPoint point,
            GeoPoint segmentStart,
            GeoPoint segmentEnd
    ) {

        double latitudeRad =
                Math.toRadians(
                        point.getLatitude()
                );

        double metersPerDegreeLatitude =
                111_320.0;

        double metersPerDegreeLongitude =
                111_320.0
                        * Math.cos(latitudeRad);

        double startX =
                (segmentStart.getLongitude()
                        - point.getLongitude())
                        * metersPerDegreeLongitude;

        double startY =
                (segmentStart.getLatitude()
                        - point.getLatitude())
                        * metersPerDegreeLatitude;

        double endX =
                (segmentEnd.getLongitude()
                        - point.getLongitude())
                        * metersPerDegreeLongitude;

        double endY =
                (segmentEnd.getLatitude()
                        - point.getLatitude())
                        * metersPerDegreeLatitude;

        double dx = endX - startX;
        double dy = endY - startY;

        double lengthSquared =
                dx * dx + dy * dy;

        if (lengthSquared == 0.0) {
            return Math.hypot(startX, startY);
        }

        double t =
                -(
                    startX * dx
                    + startY * dy
                )
                / lengthSquared;

        t = Math.max(
                0.0,
                Math.min(1.0, t)
        );

        double closestX =
                startX + t * dx;

        double closestY =
                startY + t * dy;

        return Math.hypot(
                closestX,
                closestY
        );
    }
}