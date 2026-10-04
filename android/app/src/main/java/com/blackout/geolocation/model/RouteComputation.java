package com.blackout.geolocation.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Internal representation of the information eventually
 * mapped into the canonical RouteDto.
 */
public final class RouteComputation {

    private final String routeId;
    private final GeoPoint origin;
    private final GeoPoint destination;
    private final double distanceM;
    private final double durationS;
    private final List<GeoPoint> geometry;
    private final List<String> avoidedHazardIds;
    private final long calculatedAtMs;

    public RouteComputation(
            String routeId,
            GeoPoint origin,
            GeoPoint destination,
            double distanceM,
            double durationS,
            List<GeoPoint> geometry,
            List<String> avoidedHazardIds,
            long calculatedAtMs
    ) {

        this.routeId = routeId;
        this.origin = origin;
        this.destination = destination;
        this.distanceM = distanceM;
        this.durationS = durationS;

        this.geometry =
                Collections.unmodifiableList(
                        new ArrayList<>(geometry)
                );

        this.avoidedHazardIds =
                Collections.unmodifiableList(
                        new ArrayList<>(
                                avoidedHazardIds
                        )
                );

        this.calculatedAtMs = calculatedAtMs;
    }

    public String getRouteId() {
        return routeId;
    }

    public GeoPoint getOrigin() {
        return origin;
    }

    public GeoPoint getDestination() {
        return destination;
    }

    public double getDistanceM() {
        return distanceM;
    }

    public double getDurationS() {
        return durationS;
    }

    public List<GeoPoint> getGeometry() {
        return geometry;
    }

    public List<String> getAvoidedHazardIds() {
        return avoidedHazardIds;
    }

    public long getCalculatedAtMs() {
        return calculatedAtMs;
    }
}