package com.blackout.geolocation;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Directed edge in the offline road graph.
 *
 * baseCost and hazardPenalty are both expressed as
 * distance-equivalent routing cost in metres.
 */
public final class GraphEdge {

    private final String edgeId;
    private final String fromNodeId;
    private final String toNodeId;

    private final double distanceM;
    private final double baseCost;

    private final String roadType;

    private boolean baseBlocked;
    private boolean hazardBlocked;

    private double hazardPenalty;

    private final Set<String> hazardIds =
            new LinkedHashSet<>();

    public GraphEdge(
            String edgeId,
            String fromNodeId,
            String toNodeId,
            double distanceM,
            double baseCost,
            boolean blocked,
            String roadType
    ) {

        if (edgeId == null || edgeId.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "edgeId is required."
            );
        }

        if (fromNodeId == null
                || fromNodeId.trim().isEmpty()
                || toNodeId == null
                || toNodeId.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Both endpoint node IDs are required."
            );
        }

        if (Double.isNaN(distanceM)
                || Double.isInfinite(distanceM)
                || distanceM < 0.0) {

            throw new IllegalArgumentException(
                    "distanceM must be non-negative."
            );
        }

        /*
         * baseCost must not be smaller than actual distance.
         * This keeps Haversine a valid lower-bound heuristic.
         */
        if (Double.isNaN(baseCost)
                || Double.isInfinite(baseCost)
                || baseCost < distanceM) {

            throw new IllegalArgumentException(
                    "baseCost must be >= distanceM."
            );
        }

        this.edgeId = edgeId;
        this.fromNodeId = fromNodeId;
        this.toNodeId = toNodeId;
        this.distanceM = distanceM;
        this.baseCost = baseCost;
        this.baseBlocked = blocked;
        this.roadType =
                roadType == null ? "UNKNOWN" : roadType;
    }

    public String getEdgeId() {
        return edgeId;
    }

    public String getFromNodeId() {
        return fromNodeId;
    }

    public String getToNodeId() {
        return toNodeId;
    }

    public double getDistanceM() {
        return distanceM;
    }

    public double getBaseCost() {
        return baseCost;
    }

    public boolean isBlocked() {
        return baseBlocked || hazardBlocked;
    }

    public boolean isBaseBlocked() {
        return baseBlocked;
    }

    public boolean isHazardBlocked() {
        return hazardBlocked;
    }

    public void setBlocked(boolean blocked) {
        this.baseBlocked = blocked;
    }

    public double getHazardPenalty() {
        return hazardPenalty;
    }

    public double getEffectiveCost() {
        return baseCost + hazardPenalty;
    }

    public String getRoadType() {
        return roadType;
    }

    public Set<String> getHazardIds() {
        return Collections.unmodifiableSet(
                hazardIds
        );
    }

    public void applyHazard(
            String hazardId,
            double penaltyM,
            boolean block
    ) {

        if (hazardId == null
                || hazardId.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "hazardId is required."
            );
        }

        if (Double.isNaN(penaltyM)
                || Double.isInfinite(penaltyM)
                || penaltyM < 0.0) {

            throw new IllegalArgumentException(
                    "Hazard penalty must be non-negative."
            );
        }

        hazardIds.add(hazardId);
        hazardPenalty += penaltyM;

        if (block) {
            hazardBlocked = true;
        }
    }

    public void clearHazardState() {
        hazardPenalty = 0.0;
        hazardBlocked = false;
        hazardIds.clear();
    }
}