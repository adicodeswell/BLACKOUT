package com.blackout.network.reliability;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Prevents infinite network storms in the mesh by remembering recent messages.
 * If a duplicate is received, it is silently dropped.
 */
public class MessageDeduplicator {
    // Keep a bounded thread-safe LRU cache of the last 10,000 message IDs seen.
    private static final int MAX_ENTRIES = 10000;
    
    private final Map<String, Long> seenMessages = Collections.synchronizedMap(
            new LinkedHashMap<String, Long>(MAX_ENTRIES, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, Long> eldest) {
                    return size() > MAX_ENTRIES;
                }
            });

    /**
     * Checks if this message has already been processed.
     */
    public boolean isDuplicate(String messageId) {
        return seenMessages.containsKey(messageId);
    }

    /**
     * Records a message as seen.
     */
    public void recordMessage(String messageId) {
        seenMessages.put(messageId, System.currentTimeMillis());
    }
}
