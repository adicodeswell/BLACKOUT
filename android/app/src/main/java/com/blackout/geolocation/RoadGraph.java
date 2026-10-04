package com.blackout.geolocation;

import com.blackout.geolocation.model.GeoPoint;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Directed offline road graph.
 */
public final class RoadGraph {

    private final Map<String, GraphNode> nodes =
            new LinkedHashMap<>();

    private final Map<String, GraphEdge> edges =
            new LinkedHashMap<>();

    private final Set<String> connectedNodeIds =
            new HashSet<>();

    public void addNode(GraphNode node) {

        if (node == null) {
            throw new IllegalArgumentException(
                    "node is required."
            );
        }

        if (nodes.containsKey(node.getNodeId())) {
            throw new IllegalArgumentException(
                    "Duplicate node ID: "
                            + node.getNodeId()
            );
        }

        nodes.put(node.getNodeId(), node);
    }

    public void addEdge(GraphEdge edge) {

        if (edge == null) {
            throw new IllegalArgumentException(
                    "edge is required."
            );
        }

        if (edges.containsKey(edge.getEdgeId())) {
            throw new IllegalArgumentException(
                    "Duplicate edge ID: "
                            + edge.getEdgeId()
            );
        }

        GraphNode fromNode =
                nodes.get(edge.getFromNodeId());

        GraphNode toNode =
                nodes.get(edge.getToNodeId());

        if (fromNode == null || toNode == null) {
            throw new IllegalArgumentException(
                    "Both edge endpoints must already exist."
            );
        }

        edges.put(edge.getEdgeId(), edge);
        fromNode.addOutgoingEdge(edge);

        connectedNodeIds.add(
                edge.getFromNodeId()
        );

        connectedNodeIds.add(
                edge.getToNodeId()
        );
    }

    public GraphNode getNode(String nodeId) {
        return nodes.get(nodeId);
    }

    public GraphEdge getEdge(String edgeId) {
        return edges.get(edgeId);
    }

    public Collection<GraphNode> getNodes() {
        return Collections.unmodifiableCollection(
                nodes.values()
        );
    }

    public Collection<GraphEdge> getEdges() {
        return Collections.unmodifiableCollection(
                edges.values()
        );
    }

    /**
     * Finds the nearest graph node within the allowed
     * snapping distance.
     */
    public GraphNode findNearestNode(
            GeoPoint point,
            double maxSnapDistanceM
    ) {

        if (point == null) {
            throw new IllegalArgumentException(
                    "point is required."
            );
        }

        if (maxSnapDistanceM < 0.0) {
            throw new IllegalArgumentException(
                    "maxSnapDistanceM must be >= 0."
            );
        }

        GraphNode nearestNode = null;
        double bestDistance =
                Double.POSITIVE_INFINITY;

        for (GraphNode node : nodes.values()) {

            if (!connectedNodeIds.contains(
                    node.getNodeId())) {
                continue;
            }

            double distance =
                    DistanceCalculator.haversine(
                            point,
                            node.getPoint()
                    );

            if (distance <= maxSnapDistanceM
                    && distance < bestDistance) {

                bestDistance = distance;
                nearestNode = node;
            }
        }

        return nearestNode;
    }

    public void clearDynamicHazards() {

        for (GraphEdge edge : edges.values()) {
            edge.clearHazardState();
        }
    }
}