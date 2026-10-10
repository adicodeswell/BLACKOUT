const fs = require('fs');
const file = 'android/app/src/test/java/com/blackout/data/dao/FakeNetworkMessageDao.java';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `    public List<NetworkMessageEntity> findPendingOutbound() {
        return new ArrayList<>();
    }`,
  `    public List<NetworkMessageEntity> findPendingOutbound() {
        return new ArrayList<>();
    }

    @Override
    public List<NetworkMessageEntity> getAllMessages() {
        return new ArrayList<>(store.values());
    }`
);
fs.writeFileSync(file, content);
