package com.blackout.geolocation;

/**
 * Validates candidate GPS fixes.
 *
 * This class is pure Java and does not depend on Android APIs.
 */
public final class LocationValidator {

    /**
     * A GPS fix older than this is considered stale.
     */
    public static final long DEFAULT_MAX_AGE_MS = 10_000L;

    /**
     * A GPS fix less accurate than this is rejected.
     */
    public static final double DEFAULT_MAX_ACCURACY_M = 100.0;

    public enum Status {
        VALID,
        INVALID_COORDINATES,
        STALE,
        INACCURATE
    }

    public static final class ValidationResult {

        private final Status status;
        private final String reason;

        private ValidationResult(
                Status status,
                String reason
        ) {
            this.status = status;
            this.reason = reason;
        }

        public boolean isValid() {
            return status == Status.VALID;
        }

        public Status getStatus() {
            return status;
        }

        public String getReason() {
            return reason;
        }
    }

    private final long maxAgeMs;
    private final double maxAccuracyM;

    public LocationValidator() {
        this(
                DEFAULT_MAX_AGE_MS,
                DEFAULT_MAX_ACCURACY_M
        );
    }

    public LocationValidator(
            long maxAgeMs,
            double maxAccuracyM
    ) {
        if (maxAgeMs < 0) {
            throw new IllegalArgumentException(
                    "maxAgeMs must be >= 0."
            );
        }

        if (Double.isNaN(maxAccuracyM)
                || Double.isInfinite(maxAccuracyM)
                || maxAccuracyM < 0.0) {

            throw new IllegalArgumentException(
                    "maxAccuracyM must be a valid non-negative number."
            );
        }

        this.maxAgeMs = maxAgeMs;
        this.maxAccuracyM = maxAccuracyM;
    }

    public ValidationResult validate(
            double latitude,
            double longitude,
            double accuracyM,
            long capturedAtMs,
            long nowMs
    ) {

        if (!com.blackout.geolocation.model.GeoPoint
                .isValidLatitude(latitude)
                || !com.blackout.geolocation.model.GeoPoint
                .isValidLongitude(longitude)
                || Double.isNaN(accuracyM)
                || Double.isInfinite(accuracyM)
                || accuracyM < 0.0
                || capturedAtMs <= 0L
                || nowMs <= 0L
                || capturedAtMs > nowMs) {

            return new ValidationResult(
                    Status.INVALID_COORDINATES,
                    "Location coordinates, accuracy, or timestamp are invalid."
            );
        }

        long ageMs = nowMs - capturedAtMs;

        if (ageMs > maxAgeMs) {
            return new ValidationResult(
                    Status.STALE,
                    "The GPS fix is stale."
            );
        }

        if (accuracyM > maxAccuracyM) {
            return new ValidationResult(
                    Status.INACCURATE,
                    "The GPS fix is outside the allowed accuracy threshold."
            );
        }

        return new ValidationResult(
                Status.VALID,
                "Location is valid."
        );
    }
}