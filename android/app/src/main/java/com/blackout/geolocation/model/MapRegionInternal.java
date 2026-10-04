package com.blackout.geolocation.model;

/**
 * Internal representation of a rectangular geographic map region.
 */
public final class MapRegionInternal {

    private final double minLatitude;
    private final double minLongitude;
    private final double maxLatitude;
    private final double maxLongitude;

    public MapRegionInternal(
            double minLatitude,
            double minLongitude,
            double maxLatitude,
            double maxLongitude
    ) {

        if (!GeoPoint.isValidLatitude(minLatitude)
                || !GeoPoint.isValidLatitude(maxLatitude)
                || !GeoPoint.isValidLongitude(minLongitude)
                || !GeoPoint.isValidLongitude(maxLongitude)) {

            throw new IllegalArgumentException(
                    "MapRegion contains invalid coordinates."
            );
        }

        if (minLatitude >= maxLatitude) {
            throw new IllegalArgumentException(
                    "minLatitude must be smaller than maxLatitude."
            );
        }

        if (minLongitude >= maxLongitude) {
            throw new IllegalArgumentException(
                    "minLongitude must be smaller than maxLongitude."
            );
        }

        this.minLatitude = minLatitude;
        this.minLongitude = minLongitude;
        this.maxLatitude = maxLatitude;
        this.maxLongitude = maxLongitude;
    }

    public double getMinLatitude() {
        return minLatitude;
    }

    public double getMinLongitude() {
        return minLongitude;
    }

    public double getMaxLatitude() {
        return maxLatitude;
    }

    public double getMaxLongitude() {
        return maxLongitude;
    }

    /**
     * Returns true if this region contains the given point.
     */
    public boolean contains(GeoPoint point) {

        if (point == null) {
            return false;
        }

        return point.getLatitude() >= minLatitude
                && point.getLatitude() <= maxLatitude
                && point.getLongitude() >= minLongitude
                && point.getLongitude() <= maxLongitude;
    }

    /**
     * Returns true if this available region completely contains
     * the requested region.
     */
    public boolean containsRegion(
            MapRegionInternal requested
    ) {

        if (requested == null) {
            return false;
        }

        return requested.minLatitude >= minLatitude
                && requested.maxLatitude <= maxLatitude
                && requested.minLongitude >= minLongitude
                && requested.maxLongitude <= maxLongitude;
    }
}