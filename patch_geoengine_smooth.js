const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/geolocation/OfflineGeoEngine.java';
let code = fs.readFileSync(path, 'utf8');

// Replace the jagged graph logic
const newLogic = `            GraphNode prevNode = null;
            int steps = 20; // More steps for a smoother path
            for (int i = 0; i <= steps; i++) {
                double fraction = (double) i / steps;
                double lat = origin.getLatitude() + (destination.getLatitude() - origin.getLatitude()) * fraction;
                double lon = origin.getLongitude() + (destination.getLongitude() - origin.getLongitude()) * fraction;
                
                // Add a very subtle, smooth curve instead of a harsh zig-zag
                if (i > 0 && i < steps) {
                   double curve = Math.sin(fraction * Math.PI) * 0.001; 
                   lat += curve;
                   lon -= curve;
                }
                
                GraphNode node = new GraphNode("node_" + i, new GeoPoint(lat, lon));
                activeGraph.addNode(node);
                
                if (prevNode != null) {
                    double dist = DistanceCalculator.haversine(prevNode.getPoint(), node.getPoint());
                    GraphEdge edge = new GraphEdge("edge_" + i, prevNode.getNodeId(), node.getNodeId(), dist, dist, false, "primary");
                    activeGraph.addEdge(edge);
                }
                prevNode = node;
            }`;

const regex = /GraphNode prevNode = null;[\s\S]*?prevNode = node;\n            \}/;
code = code.replace(regex, newLogic);

fs.writeFileSync(path, code);
