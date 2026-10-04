package com.blackout.geolocation.model;

/**
 * Normalized internal representation of a hazard.
 *
 * Hazard geometry is resolved into a center point and effective radius
 * before it reaches the routing engine.
 */
public final class HazardState {

    public enum Status {
        ACTIVE,
        RESOLVED,
        EXPIRED
    }

    private final String hazardId;
    private final GeoPoint center;
    private final double radiusM;
    private final int severityRank;
    private final double penaltyM;
    private final boolean blocksRoad;
    private final Status status;
    private final long expiresAtMs;

    public HazardState(
            String hazardId,
            GeoPoint center,
            double radiusM,
            int severityRank,
            double penaltyM,
            boolean blocksRoad,
            Status status,
            long expiresAtMs
    ) {

        if (hazardId == null
                || hazardId.trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "hazardId is required."
            );
        }

        if (center == null) {
            throw new IllegalArgumentException(
                    "center is required."
            );
        }

        if (radiusM < 0.0 || penaltyM < 0.0) {
            throw new IllegalArgumentException(
                    "radiusM and penaltyM must be >= 0."
            );
        }

        if (severityRank < 0 || severityRank > 4) {
            throw new IllegalArgumentException(
                    "severityRank must be between 0 and 4."
            );
        }

        this.hazardId = hazardId;
        this.center = center;
        this.radiusM = radiusM;
        this.severityRank = severityRank;
        this.penaltyM = penaltyM;
        this.blocksRoad = blocksRoad;
        this.status = status;
        this.expiresAtMs = expiresAtMs;
    }

    public String getHazardId() {
        return hazardId;
    }

    public GeoPoint getCenter() {
        return center;
    }

    public double getRadiusM() {
        return radiusM;
    }

    public int getSeverityRank() {
        return severityRank;
    }

    public double getPenaltyM() {
        return penaltyM;
    }

    public boolean blocksRoad() {
        return blocksRoad;
    }

    public Status getStatus() {
        return status;
    }

    public boolean isActive(long nowMs) {

        if (status != Status.ACTIVE) {
            return false;
        }

        return expiresAtMs <= 0L
                || nowMs < expiresAtMs;
    }

    /**
     * Converts the canonical TypeScript severity values
     * into a deterministic internal ranking.
     */
    public static int severityRank(String severity) {

        if (severity == null) {
            return 0;
        }

        switch (severity) {
            case "LOW":
                return 1;

            case "MEDIUM":
                return 2;

            case "HIGH":
                return 3;

            case "CRITICAL":
                return 4;

            case "UNKNOWN":
            default:
                return 0;
        }
    }
}