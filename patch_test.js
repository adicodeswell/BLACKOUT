const fs = require('fs');
const file = 'android/app/src/test/java/com/blackout/network/protocol/HandshakeIntegrationTest.java';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  `new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {
                if (message.getMessageType() == MessageType.REPORT) {
                    appMessageLatch.countDown();
                }
            }
        }`,
  `new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {
                if (message.getMessageType() == MessageType.REPORT) {
                    appMessageLatch.countDown();
                }
            }
            @Override
            public void onPeerDisconnected(String peerId) {}
        }`
);
content = content.replace(
  `message -> {}`,
  `new MessageHandler.AppMessageListener() {
            @Override
            public void onApplicationMessage(NetworkMessage message) {}
            @Override
            public void onPeerDisconnected(String peerId) {}
        }`
);
fs.writeFileSync(file, content);
