const fs = require('fs');
const file = 'android/app/src/main/java/com/blackout/network/transport/ConnectionManager.java';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `    public List<String> getActivePeerIds() {
        return new ArrayList<>(connections.keySet());
    }`,
  `    public List<String> getActivePeerIds() {
        List<String> activeIds = new ArrayList<>();
        for (String id : connections.keySet()) {
            if (!id.startsWith("TEMP-")) {
                activeIds.add(id);
            }
        }
        return activeIds;
    }`
);
fs.writeFileSync(file, content);
