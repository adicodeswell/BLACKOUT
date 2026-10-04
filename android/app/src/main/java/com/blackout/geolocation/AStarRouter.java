package com.blackout.geolocation;

import com.blackout.geolocation.model.GeoPoint;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.PriorityQueue;
import java.util.Set;

/**
 * Offline A* routing engine.
 */
public final class AStarRouter {

    public static final class Options {

        private final boolean avoidHazards;
        private final boolean avoidBlockedRoads;
        private final int maxHazardSeverity;
        private final double maxSnapDistanceM;

        public Options(
                boolean avoidHazards,
                boolean avoidBlockedRoads,
                int maxHazardSeverity,
                double maxSnapDistanceM
        ) {

            if (maxHazardSeverity < 0
                    || maxHazardSeverity > 4) {

                throw new IllegalArgumentException(
                        "maxHazardSeverity must be between 0 and 4."
                );
            }

            if (maxSnapDistanceM < 0.0) {
                throw new IllegalArgumentException(
                        "maxSnapDistanceM must be >= 0."
                );
            }

            this.avoidHazards = avoidHazards;
            this.avoidBlockedRoads =
                    avoidBlockedRoads;
            this.maxHazardSeverity =
                    maxHazardSeverity;
            this.maxSnapDistanceM =
                    maxSnapDistanceM;
        }

        public boolean avoidHazards() {
            return avoidHazards;
        }

        public boolean avoidBlockedRoads() {
            return avoidBlockedRoads;
        }

        public int maxHazardSeverity() {
            return maxHazardSeverity;
        }

        public double maxSnapDistanceM() {
            return maxSnapDistanceM;
        }
    }

    private static final class QueueEntry {

        private final String nodeId;
        private final double fScore;

        private QueueEntry(
                String nodeId,
                double fScore
        ) {
            this.nodeId = nodeId;
            this.fScore = fScore;
        }
    }

    private static final class PathSearchResult {

        private final List<GraphNode> nodes;
        private final List<GraphEdge> edges;
        private final double distanceM;
        private final double routingCost;

        private PathSearchResult(
                List<GraphNode> nodes,
                List<GraphEdge> edges,
                double distanceM,
                double routingCost
        ) {
            this.nodes = nodes;
            this.edges = edges;
            this.distanceM = distanceM;
            this.routingCost = routingCost;
        }
    }

    public RouteResult calculateRoute(
            RoadGraph graph,
            GeoPoint start,
            GeoPoint destination,
            Options options
    ) {

        Objects.requireNonNull(graph);
        Objects.requireNonNull(start);
        Objects.requireNonNull(destination);
        Objects.requireNonNull(options);

        GraphNode startNode =
                graph.findNearestNode(
                        start,
                        options.maxSnapDistanceM()
                );

        GraphNode destinationNode =
                graph.findNearestNode(
                        destination,
                        options.maxSnapDistanceM()
                );

        if (startNode == null
                || destinationNode == null) {

            throw new NoRouteException(
                    "Origin or destination could not be snapped to the road graph."
            );
        }

        /*
         * Primary route.
         *
         * When avoidHazards=true, use hazard penalties.
         * Otherwise use only normal base cost.
         */
        PathSearchResult primary =
                findPath(
                        graph,
                        startNode,
                        destinationNode,
                        options.avoidBlockedRoads(),
                        options.avoidHazards(),
                        options.avoidHazards()
                );

        if (primary == null) {
            throw new NoRouteException(
                    "No usable route exists."
            );
        }

        Set<String> avoidedHazards =
                new LinkedHashSet<>();

        /*
         * To determine which hazards were actually avoided,
         * calculate a baseline path that ignores hazard effects.
         */
        if (options.avoidHazards()) {

            PathSearchResult baseline =
                    findPath(
                            graph,
                            startNode,
                            destinationNode,
                            options.avoidBlockedRoads(),
                            false,
                            false
                    );

            if (baseline != null) {

                Set<String> primaryEdgeIds =
                        new HashSet<>();

                for (GraphEdge edge :
                        primary.edges) {

                    primaryEdgeIds.add(
                            edge.getEdgeId()
                    );
                }

                for (GraphEdge edge :
                        baseline.edges) {

                    if (!primaryEdgeIds.contains(
                            edge.getEdgeId())) {

                        avoidedHazards.addAll(
                                edge.getHazardIds()
                        );
                    }
                }
            }
        }

        return new RouteResult(
                primary.nodes,
                primary.edges,
                primary.distanceM,
                primary.routingCost,
                avoidedHazards
        );
    }

    private PathSearchResult findPath(
            RoadGraph graph,
            GraphNode start,
            GraphNode goal,
            boolean avoidBlockedRoads,
            boolean useHazardCost,
            boolean avoidHazardBlocks
    ) {

        PriorityQueue<QueueEntry> openSet =
                new PriorityQueue<>(
                        Comparator.comparingDouble(
                                entry -> entry.fScore
                        )
                );

        Map<String, Double> gScore =
                new HashMap<>();

        Map<String, String> cameFromNode =
                new HashMap<>();

        Map<String, GraphEdge> cameFromEdge =
                new HashMap<>();

        Set<String> closedSet =
                new HashSet<>();

        gScore.put(
                start.getNodeId(),
                0.0
        );

        openSet.add(
                new QueueEntry(
                        start.getNodeId(),
                        heuristic(start, goal)
                )
        );

        while (!openSet.isEmpty()) {

            QueueEntry currentEntry =
                    openSet.poll();

            String currentNodeId =
                    currentEntry.nodeId;

            if (!closedSet.add(
                    currentNodeId)) {
                continue;
            }

            GraphNode current =
                    graph.getNode(currentNodeId);

            if (current == null) {
                continue;
            }

            if (currentNodeId.equals(
                    goal.getNodeId())) {

                return reconstructPath(
                        graph,
                        start,
                        goal,
                        cameFromNode,
                        cameFromEdge,
                        gScore.get(
                                goal.getNodeId()
                        )
                );
            }

            for (GraphEdge edge :
                    current.getOutgoingEdges()) {

                if (avoidBlockedRoads
                        && edge.isBaseBlocked()) {
                    continue;
                }

                if (avoidHazardBlocks
                        && edge.isHazardBlocked()) {
                    continue;
                }

                double edgeCost =
                        useHazardCost
                                ? edge.getEffectiveCost()
                                : edge.getBaseCost();

                double tentativeGScore =
                        gScore.get(currentNodeId)
                                + edgeCost;

                String neighbourId =
                        edge.getToNodeId();

                double oldGScore =
                        gScore.getOrDefault(
                                neighbourId,
                                Double.POSITIVE_INFINITY
                        );

                if (tentativeGScore
                        < oldGScore) {

                    gScore.put(
                            neighbourId,
                            tentativeGScore
                    );

                    cameFromNode.put(
                            neighbourId,
                            currentNodeId
                    );

                    cameFromEdge.put(
                            neighbourId,
                            edge
                    );

                    GraphNode neighbour =
                            graph.getNode(
                                    neighbourId
                            );

                    double fScore =
                            tentativeGScore
                                    + heuristic(
                                            neighbour,
                                            goal
                                    );

                    openSet.add(
                            new QueueEntry(
                                    neighbourId,
                                    fScore
                            )
                    );
                }
            }
        }

        return null;
    }

    private double heuristic(
            GraphNode node,
            GraphNode goal
    ) {

        return DistanceCalculator.haversine(
                node.getPoint(),
                goal.getPoint()
        );
    }

    private PathSearchResult reconstructPath(
            RoadGraph graph,
            GraphNode start,
            GraphNode goal,
            Map<String, String> cameFromNode,
            Map<String, GraphEdge> cameFromEdge,
            double routingCost
    ) {

        List<GraphNode> nodes =
                new ArrayList<>();

        List<GraphEdge> edges =
                new ArrayList<>();

        String currentId =
                goal.getNodeId();

        nodes.add(goal);

        while (!currentId.equals(
                start.getNodeId())) {

            GraphEdge edge =
                    cameFromEdge.get(
                            currentId
                    );

            String parentId =
                    cameFromNode.get(
                            currentId
                    );

            if (edge == null
                    || parentId == null) {

                throw new NoRouteException(
                        "Route predecessor chain is incomplete."
                );
            }

            edges.add(edge);

            currentId = parentId;

            GraphNode parent =
                    graph.getNode(currentId);

            if (parent == null) {
                throw new NoRouteException(
                        "Route contains an invalid graph node."
                );
            }

            nodes.add(parent);
        }

        Collections.reverse(nodes);
        Collections.reverse(edges);

        double distanceM = 0.0;

        for (GraphEdge edge : edges) {
            distanceM += edge.getDistanceM();
        }

        return new PathSearchResult(
                nodes,
                edges,
                distanceM,
                routingCost
        );
    }

    public static final class NoRouteException
            extends RuntimeException {

        public NoRouteException(
                String message
        ) {
            super(message);
        }
    }
}