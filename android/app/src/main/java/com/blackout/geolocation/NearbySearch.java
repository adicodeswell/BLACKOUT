package com.blackout.geolocation;

import com.blackout.geolocation.model.GeoPoint;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Collections;
import java.util.List;

/**
 * Searches locally available geographic candidates.
 *
 * No remote Places API is used.
 */
public final class NearbySearch {

    public static final class Candidate {

        private final String id;
        private final String type;
        private final GeoPoint location;
        private final String title;

        public Candidate(
                String id,
                String type,
                GeoPoint location,
                String title
        ) {

            this.id = id;
            this.type = type;
            this.location = location;
            this.title = title;
        }

        public String getId() {
            return id;
        }

        public String getType() {
            return type;
        }

        public GeoPoint getLocation() {
            return location;
        }

        public String getTitle() {
            return title;
        }
    }

    public static final class NearbyItem {

        private final String id;
        private final String type;
        private final GeoPoint location;
        private final double distanceM;
        private final String title;

        private NearbyItem(
                String id,
                String type,
                GeoPoint location,
                double distanceM,
                String title
        ) {

            this.id = id;
            this.type = type;
            this.location = location;
            this.distanceM = distanceM;
            this.title = title;
        }

        public String getId() {
            return id;
        }

        public String getType() {
            return type;
        }

        public GeoPoint getLocation() {
            return location;
        }

        public double getDistanceM() {
            return distanceM;
        }

        public String getTitle() {
            return title;
        }
    }

    public List<NearbyItem> findNearby(
            String type,
            GeoPoint center,
            double radiusM,
            Collection<Candidate> candidates
    ) {

        if (center == null) {
            throw new IllegalArgumentException(
                    "center is required."
            );
        }

        if (radiusM < 0.0) {
            throw new IllegalArgumentException(
                    "radiusM must be >= 0."
            );
        }

        List<NearbyItem> result =
                new ArrayList<>();

        for (Candidate candidate : candidates) {

            if (type != null
                    && !type.equals(
                            candidate.getType()
                    )) {

                continue;
            }

            double distance =
                    DistanceCalculator.haversine(
                            center,
                            candidate.getLocation()
                    );

            if (distance <= radiusM) {

                result.add(
                        new NearbyItem(
                                candidate.getId(),
                                candidate.getType(),
                                candidate.getLocation(),
                                distance,
                                candidate.getTitle()
                        )
                );
            }
        }

        result.sort(
                Comparator.comparingDouble(
                        NearbyItem::getDistanceM
                )
        );

        return Collections.unmodifiableList(
                result
        );
    }
}