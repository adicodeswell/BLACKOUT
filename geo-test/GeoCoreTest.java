package com.blackout.geolocation;

import com.blackout.geolocation.model.GeoPoint;
import com.blackout.geolocation.model.HazardState;

import java.util.Arrays;

public final class GeoCoreTest {

    private static int passed = 0;
    private static int failed = 0;

    public static void main(String[] args) {

        test("Same point distance", GeoCoreTest::samePointDistance);
        test("Haversine distance", GeoCoreTest::haversineDistance);
        test("Location validation", GeoCoreTest::validLocation);
        test("Stale location rejected", GeoCoreTest::staleLocation);
        test("Poor accuracy rejected", GeoCoreTest::poorAccuracy);
        test("A* shortest path", GeoCoreTest::shortestPath);
        test("Directed edge behavior", GeoCoreTest::directedGraph);
        test("Blocked road rerouting", GeoCoreTest::blockedRoad);
        test("Hazard rerouting", GeoCoreTest::hazardRerouting);
        test("No route", GeoCoreTest::noRoute);

        test("Expired hazard ignored", GeoCoreTest::expiredHazardIgnored);
        test("Hazard can block road", GeoCoreTest::blockingHazard);
        test("Map region validation", GeoCoreTest::mapRegionValidation);
        test("Nearby radius filtering", GeoCoreTest::nearbyRadiusFiltering);

        System.out.println();
        System.out.println(
                "PASSED: " + passed
        );

        System.out.println(
                "FAILED: " + failed
        );

        if (failed > 0) {
            System.exit(1);
        }

        System.out.println(
                "ALL GEO CORE TESTS PASSED"
        );
    }

    private static void test(
            String name,
            Runnable test
    ) {

        try {
            test.run();

            passed++;

            System.out.println(
                    "[PASS] " + name
            );

        } catch (Throwable error) {

            failed++;

            System.out.println(
                    "[FAIL] " + name
            );

            System.out.println(
                    "       " + error.getMessage()
            );
        }
    }

    private static void samePointDistance() {

        GeoPoint point =
                new GeoPoint(22.5726, 88.3639);

        double distance =
                DistanceCalculator.haversine(
                        point,
                        point
                );

        assertApproximately(
                0.0,
                distance,
                0.000001,
                "Same point must have zero distance."
        );
    }

    private static void haversineDistance() {

        GeoPoint a =
                new GeoPoint(0.0, 0.0);

        GeoPoint b =
                new GeoPoint(0.001, 0.0);

        double distance =
                DistanceCalculator.haversine(
                        a,
                        b
                );

        /*
         * Approximately 111 metres.
         */
        assertTrue(
                distance > 100.0
                        && distance < 120.0,
                "Expected approximately 111 metres."
        );
    }

    private static void validLocation() {

        LocationValidator validator =
                new LocationValidator();

        long now =
                System.currentTimeMillis();

        LocationValidator.ValidationResult result =
                validator.validate(
                        22.5726,
                        88.3639,
                        10.0,
                        now - 1_000,
                        now
                );

        assertTrue(
                result.isValid(),
                "Recent accurate location should be valid."
        );
    }

    private static void staleLocation() {

        LocationValidator validator =
                new LocationValidator();

        long now =
                System.currentTimeMillis();

        LocationValidator.ValidationResult result =
                validator.validate(
                        22.5726,
                        88.3639,
                        10.0,
                        now - 30_000,
                        now
                );

        assertTrue(
                result.getStatus()
                        == LocationValidator.Status.STALE,
                "Old GPS fix should be stale."
        );
    }

    private static void poorAccuracy() {

        LocationValidator validator =
                new LocationValidator();

        long now =
                System.currentTimeMillis();

        LocationValidator.ValidationResult result =
                validator.validate(
                        22.5726,
                        88.3639,
                        250.0,
                        now - 1_000,
                        now
                );

        assertTrue(
                result.getStatus()
                        == LocationValidator.Status.INACCURATE,
                "Poor GPS accuracy should be rejected."
        );
    }

    private static RoadGraph createTestGraph() {

        RoadGraph graph =
                new RoadGraph();

        GraphNode a =
                new GraphNode(
                        "A",
                        new GeoPoint(0.0, 0.0)
                );

        GraphNode b =
                new GraphNode(
                        "B",
                        new GeoPoint(0.0, 0.001)
                );

        GraphNode c =
                new GraphNode(
                        "C",
                        new GeoPoint(0.0, 0.002)
                );

        GraphNode d =
                new GraphNode(
                        "D",
                        new GeoPoint(0.001, 0.001)
                );

        graph.addNode(a);
        graph.addNode(b);
        graph.addNode(c);
        graph.addNode(d);

        double ab =
                DistanceCalculator.haversine(
                        a.getPoint(),
                        b.getPoint()
                );

        double bc =
                DistanceCalculator.haversine(
                        b.getPoint(),
                        c.getPoint()
                );

        double bd =
                DistanceCalculator.haversine(
                        b.getPoint(),
                        d.getPoint()
                );

        double dc =
                DistanceCalculator.haversine(
                        d.getPoint(),
                        c.getPoint()
                );

        graph.addEdge(
                new GraphEdge(
                        "AB",
                        "A",
                        "B",
                        ab,
                        ab,
                        false,
                        "ROAD"
                )
        );

        graph.addEdge(
                new GraphEdge(
                        "BC",
                        "B",
                        "C",
                        bc,
                        bc,
                        false,
                        "ROAD"
                )
        );

        graph.addEdge(
                new GraphEdge(
                        "BD",
                        "B",
                        "D",
                        bd,
                        bd,
                        false,
                        "ROAD"
                )
        );

        graph.addEdge(
                new GraphEdge(
                        "DC",
                        "D",
                        "C",
                        dc,
                        dc,
                        false,
                        "ROAD"
                )
        );

        return graph;
    }

    private static AStarRouter.Options normalOptions() {

        return new AStarRouter.Options(
                true,
                true,
                4,
                500.0
        );
    }

    private static void shortestPath() {

        RoadGraph graph =
                createTestGraph();

        AStarRouter router =
                new AStarRouter();

        RouteResult result =
                router.calculateRoute(
                        graph,
                        new GeoPoint(0.0, 0.0),
                        new GeoPoint(0.0, 0.002),
                        normalOptions()
                );

        assertTrue(
                result.getEdges().size() == 2,
                "Expected A -> B -> C."
        );

        assertTrue(
                result.getEdges()
                        .get(0)
                        .getEdgeId()
                        .equals("AB"),
                "First edge should be AB."
        );

        assertTrue(
                result.getEdges()
                        .get(1)
                        .getEdgeId()
                        .equals("BC"),
                "Second edge should be BC."
        );
    }

    private static void directedGraph() {

        RoadGraph graph =
                createTestGraph();

        AStarRouter router =
                new AStarRouter();

        boolean failedAsExpected = false;

        try {

            router.calculateRoute(
                    graph,
                    new GeoPoint(0.0, 0.002),
                    new GeoPoint(0.0, 0.0),
                    normalOptions()
            );

        } catch (AStarRouter.NoRouteException error) {

            failedAsExpected = true;
        }

        assertTrue(
                failedAsExpected,
                "There should be no reverse route."
        );
    }

    private static void blockedRoad() {

        RoadGraph graph =
                createTestGraph();

        graph.getEdge("BC")
                .setBlocked(true);

        AStarRouter router =
                new AStarRouter();

        RouteResult result =
                router.calculateRoute(
                        graph,
                        new GeoPoint(0.0, 0.0),
                        new GeoPoint(0.0, 0.002),
                        normalOptions()
                );

        assertTrue(
                result.getEdges().size() == 3,
                "Expected A -> B -> D -> C."
        );
    }

    private static void hazardRerouting() {

        RoadGraph graph =
                createTestGraph();

        HazardState hazard =
                new HazardState(
                        "H1",
                        new GeoPoint(
                                0.0,
                                0.0015
                        ),
                        50.0,
                        4,
                        10_000.0,
                        false,
                        HazardState.Status.ACTIVE,
                        0L
                );

        HazardProjector projector =
                new HazardProjector();

        projector.project(
                graph,
                Arrays.asList(hazard),
                true,
                4,
                System.currentTimeMillis()
        );

        AStarRouter router =
                new AStarRouter();

        RouteResult result =
                router.calculateRoute(
                        graph,
                        new GeoPoint(0.0, 0.0),
                        new GeoPoint(0.0, 0.002),
                        normalOptions()
                );

        assertTrue(
                result.getEdges().size() == 3,
                "Hazard should force the alternative route."
        );

        assertTrue(
                result.getAvoidedHazardIds()
                        .contains("H1"),
                "H1 should be reported as avoided."
        );
    }

    private static void noRoute() {

        RoadGraph graph =
                createTestGraph();

        graph.getEdge("BC")
                .setBlocked(true);

        graph.getEdge("BD")
                .setBlocked(true);

        AStarRouter router =
                new AStarRouter();

        boolean failedAsExpected = false;

        try {

            router.calculateRoute(
                    graph,
                    new GeoPoint(0.0, 0.0),
                    new GeoPoint(0.0, 0.002),
                    normalOptions()
            );

        } catch (AStarRouter.NoRouteException error) {

            failedAsExpected = true;
        }

        assertTrue(
                failedAsExpected,
                "No route should be returned."
        );
    }

    private static void assertTrue(
            boolean condition,
            String message
    ) {

        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static void assertApproximately(
            double expected,
            double actual,
            double tolerance,
            String message
    ) {

        if (Math.abs(
                expected - actual
        ) > tolerance) {

            throw new AssertionError(
                    message
                            + " Expected "
                            + expected
                            + " but got "
                            + actual
            );
        }
    }

    private static void expiredHazardIgnored() {

    RoadGraph graph = createTestGraph();

    long now = System.currentTimeMillis();

    HazardState expired =
            new HazardState(
                    "EXPIRED-1",
                    new GeoPoint(0.0, 0.0015),
                    50.0,
                    4,
                    10_000.0,
                    true,
                    HazardState.Status.ACTIVE,
                    now - 1_000
            );

    new HazardProjector().project(
            graph,
            Arrays.asList(expired),
            true,
            4,
            now
    );

    assertTrue(
            !graph.getEdge("BC").isHazardBlocked(),
            "Expired hazard must not block an edge."
    );
}

private static void blockingHazard() {

    RoadGraph graph = createTestGraph();

    long now = System.currentTimeMillis();

    HazardState blockingHazard =
            new HazardState(
                    "BLOCK-1",
                    new GeoPoint(0.0, 0.0015),
                    50.0,
                    4,
                    0.0,
                    true,
                    HazardState.Status.ACTIVE,
                    0L
            );

    new HazardProjector().project(
            graph,
            Arrays.asList(blockingHazard),
            true,
            4,
            now
    );

    assertTrue(
            graph.getEdge("BC").isHazardBlocked(),
            "Active blocking hazard must block BC."
    );
}

private static void mapRegionValidation() {

    com.blackout.geolocation.model.MapRegionInternal
            region =
            new com.blackout.geolocation.model.MapRegionInternal(
                    0.0,
                    0.0,
                    1.0,
                    1.0
            );

    assertTrue(
            region.contains(
                    new GeoPoint(0.5, 0.5)
            ),
            "Point should be inside region."
    );

    assertTrue(
            !region.contains(
                    new GeoPoint(2.0, 2.0)
            ),
            "Point should be outside region."
    );
}

private static void nearbyRadiusFiltering() {

    NearbySearch search =
            new NearbySearch();

    GeoPoint center =
            new GeoPoint(0.0, 0.0);

    NearbySearch.Candidate nearby =
            new NearbySearch.Candidate(
                    "N1",
                    "HOSPITAL",
                    new GeoPoint(0.001, 0.0),
                    "Nearby Hospital"
            );

    NearbySearch.Candidate farAway =
            new NearbySearch.Candidate(
                    "N2",
                    "HOSPITAL",
                    new GeoPoint(1.0, 0.0),
                    "Far Hospital"
            );

    java.util.List<NearbySearch.NearbyItem> results =
            search.findNearby(
                    "HOSPITAL",
                    center,
                    200.0,
                    Arrays.asList(
                            nearby,
                            farAway
                    )
            );

    assertTrue(
            results.size() == 1,
            "Only the nearby hospital should be returned."
    );

    assertTrue(
            results.get(0)
                    .getId()
                    .equals("N1"),
            "N1 should be returned."
    );
}
}