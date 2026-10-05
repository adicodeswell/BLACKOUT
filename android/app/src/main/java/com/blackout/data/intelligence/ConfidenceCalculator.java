package com.blackout.data.intelligence;

public class ConfidenceCalculator {

    private static final long FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000L; // 24 hours

    /**
     * Calculates the deterministic confidence score (0.0 to 1.0) of an incident.
     */
    public static double calculate(
            int uniqueDevicesCount,
            boolean hasEvidence,
            int corroboratingReportsCount,
            long ageInMillis,
            boolean hasTrustedConfirmation,
            int contradictionCount
    ) {
        // Saturation Caps
        double independence = Math.min(0.35, uniqueDevicesCount * 0.07);
        double evidence = hasEvidence ? 0.25 : 0.0;
        double corroboration = Math.min(0.20, corroboratingReportsCount * 0.04);
        
        // Freshness decay (linear)
        double freshnessRatio = Math.max(0.0, 1.0 - ((double) ageInMillis / FRESHNESS_WINDOW_MS));
        double freshness = freshnessRatio * 0.10;
        
        double trusted = hasTrustedConfirmation ? 0.10 : 0.0;

        double raw = independence + evidence + corroboration + freshness + trusted;
        
        // Contradiction penalty
        double penalty = contradictionCount * 0.20;
        
        return clamp(raw - penalty);
    }

    private static double clamp(double val) {
        return Math.max(0.0, Math.min(1.0, val));
    }
}
