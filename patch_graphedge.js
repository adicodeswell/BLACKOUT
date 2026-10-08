const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/geolocation/OfflineGeoEngine.java';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `GraphEdge edge = new GraphEdge("edge_" + i, prevNode.getNodeId(), node.getNodeId(), dist, dist, false);`,
  `GraphEdge edge = new GraphEdge("edge_" + i, prevNode.getNodeId(), node.getNodeId(), dist, dist, false, "primary");`
);

fs.writeFileSync(path, code);
