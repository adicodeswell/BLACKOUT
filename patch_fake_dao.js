const fs = require('fs');
const file = 'android/app/src/test/java/com/blackout/data/dao/FakeNetworkMessageDao.java';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `    public List<NetworkMessageEntity> getPendingOutbound() {
        List<NetworkMessageEntity> res = new ArrayList<>();
        for (NetworkMessageEntity e : messages) {
            if ("QUEUED".equals(e.localDeliveryState)) res.add(e);
        }
        return res;
    }`,
  `    public List<NetworkMessageEntity> getPendingOutbound() {
        List<NetworkMessageEntity> res = new ArrayList<>();
        for (NetworkMessageEntity e : messages) {
            if ("QUEUED".equals(e.localDeliveryState)) res.add(e);
        }
        return res;
    }

    @Override
    public List<NetworkMessageEntity> getAllMessages() {
        return new ArrayList<>(messages);
    }`
);
fs.writeFileSync(file, content);
