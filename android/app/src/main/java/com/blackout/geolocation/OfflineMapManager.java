package com.blackout.geolocation;

import com.blackout.geolocation.model.MapRegionInternal;
import com.blackout.geolocation.source.OfflineMapSource;

import java.util.List;

/**
 * Chooses from locally available map sources.
 *
 * Never downloads map data.
 */
public final class OfflineMapManager {

    public static final class LoadResult {

        private final MapRegionInternal region;
        private final boolean available;
        private final OfflineMapSource.SourceType source;
        private final RoadGraph graph;

        private LoadResult(
                MapRegionInternal region,
                boolean available,
                OfflineMapSource.SourceType source,
                RoadGraph graph
        ) {

            this.region = region;
            this.available = available;
            this.source = source;
            this.graph = graph;
        }

        public MapRegionInternal getRegion() {
            return region;
        }

        public boolean isAvailable() {
            return available;
        }

        public OfflineMapSource.SourceType getSource() {
            return source;
        }

        public RoadGraph getGraph() {
            return graph;
        }
    }

    private final List<OfflineMapSource> sources;

    public OfflineMapManager(
            List<OfflineMapSource> sources
    ) {
        this.sources = sources;
    }

    public LoadResult loadOfflineMap(
            MapRegionInternal region
    ) {

        if (region == null) {
            throw new IllegalArgumentException(
                    "region is required."
            );
        }

        for (OfflineMapSource source : sources) {

            OfflineMapSource.LoadedMap loaded =
                    source.load(region);

            if (loaded != null
                    && loaded.getGraph() != null) {

                return new LoadResult(
                        loaded.getRegion(),
                        true,
                        source.getSourceType(),
                        loaded.getGraph()
                );
            }
        }

        return new LoadResult(
                region,
                false,
                null,
                null
        );
    }
}