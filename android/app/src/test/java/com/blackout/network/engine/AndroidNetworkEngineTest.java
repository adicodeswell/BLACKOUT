package com.blackout.network.engine;

import com.blackout.network.discovery.BleDiscoveryEngine;
import com.blackout.network.discovery.WifiDirectManager;
import com.blackout.network.transport.ConnectionManager;
import com.blackout.network.transport.NetworkServer;

import org.junit.Test;
import static org.junit.Assert.*;

public class AndroidNetworkEngineTest {

    @Test
    public void testEngineOrchestratesHardwareAndSockets() {
        // 1. Stub the components
        DeviceIdentity identity = new DeviceIdentity("mock-device-id");
        
        // We use nulls or stubs for hardware. The test verifies it doesn't crash 
        // and correctly updates state when hardware is missing/mocked.
        BleDiscoveryEngine mockBle = new BleDiscoveryEngine(null);
        WifiDirectManager mockWifi = new WifiDirectManager(null, null);
        ConnectionManager connManager = new ConnectionManager();
        
        // Mock server on an ephemeral port
        NetworkServer server = new NetworkServer(0, socket -> {});

        AndroidNetworkEngine engine = new AndroidNetworkEngine(
                identity, mockBle, mockWifi, connManager, server);

        assertFalse("Engine should be initially stopped", engine.isRunning());

        // 2. Start the engine
        engine.start();

        // 3. Verify it started successfully (server is up)
        assertTrue("Engine should be running", engine.isRunning());

        // 4. Stop the engine
        engine.stop();
        assertFalse("Engine should be stopped after stop()", engine.isRunning());
    }

    @Test
    public void testDeviceIdentityGeneratesCorrectly() {
        // When using the fallback testing constructor
        DeviceIdentity identity = new DeviceIdentity("TEST-ID-999");
        assertEquals("TEST-ID-999", identity.getDeviceId());
    }
}
