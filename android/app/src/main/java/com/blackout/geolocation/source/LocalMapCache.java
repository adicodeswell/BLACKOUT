package com.blackout.geolocation.source;

import com.blackout.geolocation.RoadGraph;
import com.blackout.geolocation.model.MapRegionInternal;

import java.util.ArrayList;
import java.util.List;

/**
 * Local cache of preprocessed offline road graphs.
 *
 * This implementation is intentionally in-memory for the pure-Java
 * GEO core. A disk-backed implementation can replace the storage
 * mechanism later without changing the OfflineMapSource contract.
 */
public final class LocalMapCache
        implements OfflineMapSource {

    private final List<LoadedMap> entries =
            new ArrayList<>();

    public void put(
            MapRegionInternal region,
            RoadGraph graph
    ) {

        if (region == null || graph == null) {
            throw new IllegalArgumentException(
                    "Both region and graph are required."
            );
        }

        entries.add(
                new LoadedMap(
                        region,
                        graph
                )
        );
    }

    @Override
    public LoadedMap load(
            MapRegionInternal requestedRegion
    ) {

        if (requestedRegion == null) {
            return null;
        }

        for (LoadedMap entry : entries) {

            if (entry.getRegion().containsRegion(
                    requestedRegion
            )) {

                return entry;
            }
        }

        return null;
    }

    @Override
    public SourceType getSourceType() {
        return SourceType.LOCAL_CACHE;
    }
}