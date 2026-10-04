package com.blackout.geolocation.model;

/**
 * Internal geographic point used by the GEO engine.
 *
 * This is not the same thing as the application's LocationDto.
 * GeoPoint contains only the coordinates required for geographic
 * calculations.
 */
public final class GeoPoint {

    private final double latitude;
    private final double longitude;

    public GeoPoint(double latitude, double longitude) {
        if (!isValidLatitude(latitude)) {
            throw new IllegalArgumentException(
                    "Latitude must be between -90 and 90 degrees."
            );
        }

        if (!isValidLongitude(longitude)) {
            throw new IllegalArgumentException(
                    "Longitude must be between -180 and 180 degrees."
            );
        }

        this.latitude = latitude;
        this.longitude = longitude;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public static boolean isValidLatitude(double latitude) {
        return !Double.isNaN(latitude)
                && !Double.isInfinite(latitude)
                && latitude >= -90.0
                && latitude <= 90.0;
    }

    public static boolean isValidLongitude(double longitude) {
        return !Double.isNaN(longitude)
                && !Double.isInfinite(longitude)
                && longitude >= -180.0
                && longitude <= 180.0;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (!(obj instanceof GeoPoint)) {
            return false;
        }

        GeoPoint other = (GeoPoint) obj;

        return Double.compare(latitude, other.latitude) == 0
                && Double.compare(longitude, other.longitude) == 0;
    }

    @Override
    public int hashCode() {
        int result = Double.valueOf(latitude).hashCode();
        result = 31 * result + Double.valueOf(longitude).hashCode();
        return result;
    }

    @Override
    public String toString() {
        return "GeoPoint{" +
                "latitude=" + latitude +
                ", longitude=" + longitude +
                '}';
    }
}