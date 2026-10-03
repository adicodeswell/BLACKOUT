package com.blackout.network.reliability;

import org.junit.Test;
import static org.junit.Assert.*;

public class MessageDeduplicatorTest {

    @Test
    public void testDeduplicationDropsKnownHashes() {
        MessageDeduplicator dedup = new MessageDeduplicator();
        
        String msgId1 = "msg-111";
        String msgId2 = "msg-222";

        // Record a message
        dedup.recordMessage(msgId1);

        // It should flag as duplicate
        assertTrue("Expected msg1 to be a duplicate", dedup.isDuplicate(msgId1));
        
        // Unseen message should not be a duplicate
        assertFalse("Expected msg2 to NOT be a duplicate", dedup.isDuplicate(msgId2));
    }
}
