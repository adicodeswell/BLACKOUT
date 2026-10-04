package com.blackout.geolocation.source;

import com.blackout.geolocation.RoadGraph;
import com.blackout.geolocation.model.MapRegionInternal;

/**
 * Represents a preprocessed road graph bundled with the application.
 *
 * Runtime code never downloads map data.
 */
public final class BundledMapSource
        implements OfflineMapSource {

    private final MapRegionInternal availableRegion;
    private final RoadGraph graph;

    public BundledMapSource(
            MapRegionInternal availableRegion,
            RoadGraph graph
    ) {

        this.availableRegion = availableRegion;
        this.graph = graph;
    }

    @Override
    public LoadedMap load(
            MapRegionInternal requestedRegion
    ) {

        if (requestedRegion == null
                || availableRegion == null
                || graph == null) {

            return null;
        }

        /*
         * The bundled data can satisfy the request only if
         * its available region completely contains the request.
         */
        if (!availableRegion.containsRegion(
                requestedRegion
        )) {

            return null;
        }

        return new LoadedMap(
                availableRegion,
                graph
        );
    }

    @Override
    public SourceType getSourceType() {
        return SourceType.BUNDLED;
    }
}