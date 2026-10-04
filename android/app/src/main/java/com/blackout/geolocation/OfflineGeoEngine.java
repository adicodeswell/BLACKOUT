package com.blackout.geolocation;

import com.blackout.geolocation.model.GeoPoint;
import com.blackout.geolocation.model.HazardState;
import com.blackout.geolocation.model.MapRegionInternal;
import com.blackout.geolocation.model.RouteComputation;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Pure-Java GEO engine facade.
 *
 * AndroidLocationProvider can later implement LocationProvider
 * without changing the routing core.
 */
public final class OfflineGeoEngine {

    /**
     * Average emergency-routing speed used only to estimate
     * duration_s from total route distance.
     *
     * Replace with team-approved policy if one is defined.
     */
    private static final double DEFAULT_AVERAGE_SPEED_MPS =
            13.89;

    public interface LocationProvider {

        LocationSample getCurrentLocation();

        Runnable observe(LocationListener listener);
    }

    public interface LocationListener {

        void onLocation(LocationSample location);
    }

    public static final class LocationSample {

        private final double latitude;
        private final double longitude;
        private final double accuracyM;
        private final long capturedAtMs;

        public LocationSample(
                double latitude,
                double longitude,
                double accuracyM,
                long capturedAtMs
        ) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.accuracyM = accuracyM;
            this.capturedAtMs = capturedAtMs;
        }

        public double getLatitude() {
            return latitude;
        }

        public double getLongitude() {
            return longitude;
        }

        public double getAccuracyM() {
            return accuracyM;
        }

        public long getCapturedAtMs() {
            return capturedAtMs;
        }
    }

    private final LocationProvider locationProvider;
    private final LocationValidator locationValidator;
    private final OfflineMapManager mapManager;
    private final HazardProjector hazardProjector;
    private final AStarRouter router;

    private final Map<String, HazardState> hazards =
            new LinkedHashMap<>();

    private RoadGraph activeGraph;
    private MapRegionInternal activeRegion;

    public OfflineGeoEngine(
            LocationProvider locationProvider,
            LocationValidator locationValidator,
            OfflineMapManager mapManager
    ) {

        this.locationProvider =
                locationProvider;

        this.locationValidator =
                locationValidator;

        this.mapManager =
                mapManager;

        this.hazardProjector =
                new HazardProjector();

        this.router =
                new AStarRouter();
    }

    public LocationSample getCurrentLocation() {

        if (locationProvider == null) {
            throw new GeoException(
                    "Location provider is not configured."
            );
        }

        LocationSample sample =
                locationProvider.getCurrentLocation();

        if (sample == null) {
            throw new GeoException(
                    "No GPS fix is currently available."
            );
        }

        LocationValidator.ValidationResult
                validation =
                locationValidator.validate(
                        sample.getLatitude(),
                        sample.getLongitude(),
                        sample.getAccuracyM(),
                        sample.getCapturedAtMs(),
                        System.currentTimeMillis()
                );

        if (!validation.isValid()) {
            throw new GeoException(
                    validation.getReason()
            );
        }

        return sample;
    }

    public Runnable observeLocation(
            LocationListener listener
    ) {

        if (locationProvider == null) {
            throw new GeoException(
                    "Location provider is not configured."
            );
        }

        if (listener == null) {
            throw new IllegalArgumentException(
                    "listener is required."
            );
        }

        return locationProvider.observe(
                sample -> {

                    if (sample == null) {
                        return;
                    }

                    LocationValidator.ValidationResult
                            validation =
                            locationValidator.validate(
                                    sample.getLatitude(),
                                    sample.getLongitude(),
                                    sample.getAccuracyM(),
                                    sample.getCapturedAtMs(),
                                    System.currentTimeMillis()
                            );

                    if (validation.isValid()) {
                        listener.onLocation(sample);
                    }
                }
        );
    }

    public OfflineMapManager.LoadResult
    loadOfflineMap(
            MapRegionInternal region
    ) {

        OfflineMapManager.LoadResult result =
                mapManager.loadOfflineMap(region);

        if (result.isAvailable()) {
            activeGraph =
                    result.getGraph();

            activeRegion =
                    result.getRegion();
        }

        return result;
    }

    public void addHazard(
            HazardState hazard
    ) {

        if (hazard == null) {
            throw new IllegalArgumentException(
                    "hazard is required."
            );
        }

        hazards.put(
                hazard.getHazardId(),
                hazard
        );
    }

    public List<HazardState> getHazards(
            MapRegionInternal region
    ) {

        List<HazardState> result =
                new ArrayList<>();

        for (HazardState hazard :
                hazards.values()) {

            if (region.contains(
                    hazard.getCenter()
            )) {

                result.add(hazard);
            }
        }

        return Collections.unmodifiableList(
                result
        );
    }

    public double calculateDistance(
            GeoPoint a,
            GeoPoint b
    ) {

        return DistanceCalculator.haversine(
                a,
                b
        );
    }

    public RouteComputation calculateRoute(
            GeoPoint origin,
            GeoPoint destination,
            AStarRouter.Options options
    ) {

        if (activeGraph == null
                || activeRegion == null) {

            throw new GeoException(
                    "No offline map region is loaded."
            );
        }

        if (!activeRegion.contains(origin)
                || !activeRegion.contains(destination)) {

            throw new GeoException(
                    "Origin or destination is outside the loaded map region."
            );
        }

        List<HazardState> activeHazards =
                new ArrayList<>(
                        hazards.values()
                );

        hazardProjector.project(
                activeGraph,
                activeHazards,
                options.avoidHazards(),
                options.maxHazardSeverity(),
                System.currentTimeMillis()
        );

        if (!options.avoidHazards()) {
            activeGraph.clearDynamicHazards();
        }

        RouteResult result =
                router.calculateRoute(
                        activeGraph,
                        origin,
                        destination,
                        options
                );

        double durationSeconds =
                result.getDistanceM()
                        / DEFAULT_AVERAGE_SPEED_MPS;

        return new RouteComputation(
                UUID.randomUUID().toString(),
                origin,
                destination,
                result.getDistanceM(),
                durationSeconds,
                result.getGeometry(),
                new ArrayList<>(
                        result.getAvoidedHazardIds()
                ),
                System.currentTimeMillis()
        );
    }

    public static final class GeoException
            extends RuntimeException {

        public GeoException(String message) {
            super(message);
        }
    }
}