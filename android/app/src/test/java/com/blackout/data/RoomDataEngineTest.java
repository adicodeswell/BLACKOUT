package com.blackout.data;

import org.junit.Before;
import org.junit.Test;

import com.blackout.data.dao.FakeNetworkMessageDao;
import com.blackout.data.repository.MessageRepository;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.protocol.MessageType;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThrows;

public class RoomDataEngineTest {

    private RoomDataEngine engine;
    
    @Before
    public void setup() {
        FakeNetworkMessageDao fakeDao = new FakeNetworkMessageDao();
        MessageRepository repo = new MessageRepository(fakeDao);
        engine = new RoomDataEngine(null, repo); // pass null DB, fake repo
    }

    @Test
    public void testSaveAndRetrieveReportMessage() {
        NetworkMessage msg = new NetworkMessage.Builder()
                .messageId("msg-1")
                .originDeviceId("dev-A")
                .messageType(MessageType.REPORT)
                .payloadHash("hash")
                .payload("{}")
                .build();
                
        engine.saveMessage(msg);
        
        NetworkMessage retrieved = engine.getMessage("msg-1");
        assertNotNull(retrieved);
        assertEquals("msg-1", retrieved.getMessageId());
        assertEquals(MessageType.REPORT, retrieved.getMessageType());
    }

    @Test
    public void testSaveEncryptedDirectMessage() {
        NetworkMessage msg = new NetworkMessage.Builder()
                .messageId("msg-2")
                .originDeviceId("dev-A")
                .destinationDeviceId("dev-B")
                .messageType(MessageType.DIRECT)
                .payloadHash("hash")
                .payload("encrypted-bytes")
                .encryption(new NetworkMessage.EncryptionMetadata("AES_GCM", "key1", "nonce1"))
                .build();
                
        engine.saveMessage(msg);
        
        NetworkMessage retrieved = engine.getMessage("msg-2");
        assertNotNull(retrieved);
        assertNotNull(retrieved.getEncryption());
        assertEquals("key1", retrieved.getEncryption().getKeyId());
    }

    @Test
    public void testDirectMessageSucceedsWithoutEncryption() {
        NetworkMessage msg = new NetworkMessage.Builder()
                .messageId("msg-3")
                .originDeviceId("dev-A")
                .destinationDeviceId("dev-B")
                .messageType(MessageType.DIRECT)
                .payloadHash("hash")
                .payload("plaintext")
                .build(); // No encryption provided
                
        // Should no longer throw exception
        engine.saveMessage(msg);
        NetworkMessage retrieved = engine.getMessage("msg-3");
        assertNotNull(retrieved);
        assertEquals("msg-3", retrieved.getMessageId());
    }
}
