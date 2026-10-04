package com.blackout.geolocation.source;

import com.blackout.geolocation.RoadGraph;
import com.blackout.geolocation.model.MapRegionInternal;

/**
 * Source of locally available preprocessed road graphs.
 */
public interface OfflineMapSource {

    enum SourceType {
        BUNDLED,
        LOCAL_CACHE
    }

    LoadedMap load(MapRegionInternal requestedRegion);

    SourceType getSourceType();

    final class LoadedMap {

        private final MapRegionInternal region;
        private final RoadGraph graph;

        public LoadedMap(
                MapRegionInternal region,
                RoadGraph graph
        ) {
            this.region = region;
            this.graph = graph;
        }

        public MapRegionInternal getRegion() {
            return region;
        }

        public RoadGraph getGraph() {
            return graph;
        }
    }
}
