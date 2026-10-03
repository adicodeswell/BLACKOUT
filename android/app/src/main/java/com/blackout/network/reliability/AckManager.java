package com.blackout.network.reliability;

import android.util.Log;

import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.transport.OutgoingSendManager;

import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Ensures critical messages reach their destination by tracking unacknowledged
 * messages and re-sending them using an Exponential Backoff strategy.
 */
public class AckManager {
    private static final String TAG = "AckManager";
    
    private final OutgoingSendManager sendManager;
    private final ConcurrentHashMap<String, PendingAck> unackedMessages = new ConcurrentHashMap<>();
    private final Timer retryTimer = new Timer("AckRetryTimer", true);

    private static class PendingAck {
        final NetworkMessage msg;
        final String peerId;
        int retries = 0;
        
        PendingAck(NetworkMessage msg, String peerId) {
            this.msg = msg;
            this.peerId = peerId;
        }
    }

    public AckManager(OutgoingSendManager sendManager) {
        this.sendManager = sendManager;
    }

    /**
     * Call this when sending a message that REQUIRES an ACK.
     */
    public void trackForAck(NetworkMessage msg, String peerId) {
        unackedMessages.put(msg.getMessageId(), new PendingAck(msg, peerId));
        scheduleRetry(msg.getMessageId(), 5000); // Wait 5 seconds before first retry
    }

    /**
     * Call this when an ACK is received from a peer.
     */
    public void processAck(String messageId) {
        PendingAck removed = unackedMessages.remove(messageId);
        if (removed != null) {
            Log.i(TAG, "Message " + messageId + " was successfully acknowledged!");
        }
    }

    private void scheduleRetry(String messageId, long delayMs) {
        retryTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                PendingAck pending = unackedMessages.get(messageId);
                if (pending != null) {
                    if (pending.retries < 3) {
                        pending.retries++;
                        Log.w(TAG, "Retry " + pending.retries + " for message: " + messageId);
                        
                        // Fire it over the network again
                        sendManager.sendDirect(pending.msg, pending.peerId);
                        
                        // Schedule next retry with exponential backoff (e.g. 5s -> 10s -> 20s)
                        scheduleRetry(messageId, delayMs * 2);
                    } else {
                        Log.e(TAG, "Max retries reached for message " + messageId + ". Giving up.");
                        unackedMessages.remove(messageId);
                        // In a real system, we'd trigger a UI failure event here.
                    }
                }
            }
        }, delayMs);
    }
}
