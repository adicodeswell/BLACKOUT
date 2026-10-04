package com.blackout.geolocation;

import com.blackout.geolocation.model.GeoPoint;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Internal result produced by A*.
 *
 * It is intentionally not the same as the public TypeScript RouteDto.
 */
public final class RouteResult {

    private final List<GraphNode> nodes;
    private final List<GraphEdge> edges;
    private final double distanceM;
    private final double routingCost;
    private final Set<String> avoidedHazardIds;

    public RouteResult(
            List<GraphNode> nodes,
            List<GraphEdge> edges,
            double distanceM,
            double routingCost,
            Collection<String> avoidedHazardIds
    ) {

        this.nodes = Collections.unmodifiableList(
                new ArrayList<>(nodes)
        );

        this.edges = Collections.unmodifiableList(
                new ArrayList<>(edges)
        );

        this.distanceM = distanceM;
        this.routingCost = routingCost;

        this.avoidedHazardIds =
                Collections.unmodifiableSet(
                        new LinkedHashSet<>(
                                avoidedHazardIds
                        )
                );
    }

    public List<GraphNode> getNodes() {
        return nodes;
    }

    public List<GraphEdge> getEdges() {
        return edges;
    }

    public double getDistanceM() {
        return distanceM;
    }

    public double getRoutingCost() {
        return routingCost;
    }

    public Set<String> getAvoidedHazardIds() {
        return avoidedHazardIds;
    }

    public List<GeoPoint> getGeometry() {

        List<GeoPoint> geometry =
                new ArrayList<>();

        for (GraphNode node : nodes) {
            geometry.add(node.getPoint());
        }

        return Collections.unmodifiableList(
                geometry
        );
    }
}