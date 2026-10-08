const fs = require('fs');
const path = 'android/app/src/main/java/com/blackout/network/protocol/MessageHandler.java';
let code = fs.readFileSync(path, 'utf8');

const importRegex = /import org\.json\.JSONException;/;
const newImports = `import org.json.JSONException;\nimport com.blackout.network.reliability.MessageDeduplicator;`;
code = code.replace(importRegex, newImports);

const classStart = `public class MessageHandler implements PeerConnection.ConnectionListener {
    private static final String TAG = "MessageHandler";
    
    private final ConnectionManager connectionManager;
    private final HandshakeManager handshakeManager;
    private final AppMessageListener appListener;`;

const newClassStart = `public class MessageHandler implements PeerConnection.ConnectionListener {
    private static final String TAG = "MessageHandler";
    
    private final ConnectionManager connectionManager;
    private final HandshakeManager handshakeManager;
    private final AppMessageListener appListener;
    private final MessageDeduplicator deduplicator = new MessageDeduplicator();`;

code = code.replace(classStart, newClassStart);

const receiveStart = `    @Override
    public void onMessageReceived(String peerId, byte[] payload) {
        try {
            NetworkMessage msg = MessageSerializer.deserialize(payload);
            MessageValidator.validate(msg);

            MessageType type = msg.getMessageType();`;

const newReceiveStart = `    @Override
    public void onMessageReceived(String peerId, byte[] payload) {
        try {
            NetworkMessage msg = MessageSerializer.deserialize(payload);
            MessageValidator.validate(msg);

            // Mesh Routing Loop Prevention
            if (deduplicator.isDuplicate(msg.getMessageId())) {
                Log.d(TAG, "Dropped duplicate mesh message: " + msg.getMessageId());
                return;
            }
            deduplicator.recordMessage(msg.getMessageId());

            MessageType type = msg.getMessageType();`;

code = code.replace(receiveStart, newReceiveStart);

fs.writeFileSync(path, code);
