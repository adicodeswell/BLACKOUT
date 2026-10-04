package com.blackout.geolocation;

import com.blackout.geolocation.model.GeoPoint;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * A node in the offline road graph.
 *
 * Usually represents an intersection or another important point
 * in the road network.
 */
public final class GraphNode {

    private final String nodeId;
    private final GeoPoint point;

    private final List<GraphEdge> outgoingEdges =
            new ArrayList<>();

    public GraphNode(
            String nodeId,
            GeoPoint point
    ) {
        if (nodeId == null || nodeId.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "nodeId is required."
            );
        }

        this.nodeId = nodeId;
        this.point = Objects.requireNonNull(
                point,
                "point is required."
        );
    }

    public String getNodeId() {
        return nodeId;
    }

    public GeoPoint getPoint() {
        return point;
    }

    void addOutgoingEdge(GraphEdge edge) {
        outgoingEdges.add(edge);
    }

    public List<GraphEdge> getOutgoingEdges() {
        return Collections.unmodifiableList(
                outgoingEdges
        );
    }

    @Override
    public String toString() {
        return "GraphNode{" +
                "nodeId='" + nodeId + '\'' +
                '}';
    }
}