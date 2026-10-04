package com.blackout.geolocation;

import com.blackout.geolocation.model.GeoPoint;

/**
 * Pure Java geographic distance utility.
 *
 * Uses the Haversine formula to calculate great-circle distance.
 */
public final class DistanceCalculator {

    /**
     * Mean Earth radius in metres.
     */
    public static final double EARTH_RADIUS_M = 6_371_000.0;

    private DistanceCalculator() {
        // Utility class. No instances.
    }

    public static double haversine(GeoPoint a, GeoPoint b) {
        if (a == null || b == null) {
            throw new IllegalArgumentException(
                    "Both geographic points are required."
            );
        }

        if (a.equals(b)) {
            return 0.0;
        }

        double latitude1Rad =
                Math.toRadians(a.getLatitude());

        double latitude2Rad =
                Math.toRadians(b.getLatitude());

        double deltaLatitudeRad =
                Math.toRadians(
                        b.getLatitude() - a.getLatitude()
                );

        double deltaLongitudeRad =
                Math.toRadians(
                        b.getLongitude() - a.getLongitude()
                );

        double sinLatitude =
                Math.sin(deltaLatitudeRad / 2.0);

        double sinLongitude =
                Math.sin(deltaLongitudeRad / 2.0);

        double haversineA =
                (sinLatitude * sinLatitude)
                +
                (
                    Math.cos(latitude1Rad)
                    * Math.cos(latitude2Rad)
                    * sinLongitude
                    * sinLongitude
                );

        // Protect against tiny floating-point rounding errors.
        haversineA = Math.max(
                0.0,
                Math.min(1.0, haversineA)
        );

        double centralAngle =
                2.0 * Math.atan2(
                        Math.sqrt(haversineA),
                        Math.sqrt(1.0 - haversineA)
                );

        return EARTH_RADIUS_M * centralAngle;
    }
}