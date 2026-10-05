package com.blackout.data.intelligence;

import com.blackout.data.entity.EmergencyReportEntity;
import com.blackout.data.entity.IncidentEntity;
import org.json.JSONObject;

public class SpatialAggregator {

    private static final double MERGE_RADIUS_METERS = 50.0; // 50 meters
    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Checks if a new report spatially matches an existing incident.
     * Requires the report and incident to have valid locationJson strings with "latitude" and "longitude".
     */
    public static boolean matches(EmergencyReportEntity report, IncidentEntity incident) {
        if (!report.category.equals(incident.category)) {
            return false;
        }
        
        try {
            JSONObject rLoc = new JSONObject(report.locationJson);
            JSONObject iLoc = new JSONObject(incident.locationJson);
            
            double rLat = rLoc.getDouble("latitude");
            double rLon = rLoc.getDouble("longitude");
            double iLat = iLoc.getDouble("latitude");
            double iLon = iLoc.getDouble("longitude");
            
            double distanceMeters = haversine(rLat, rLon, iLat, iLon) * 1000.0;
            return distanceMeters <= MERGE_RADIUS_METERS;
            
        } catch (Exception e) {
            // If location parsing fails, we cannot safely merge.
            return false;
        }
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
