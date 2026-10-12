package com.blackout.network.discovery;

import org.junit.Test;
import static org.junit.Assert.*;

public class WifiDirectManagerTest {

    @Test
    public void testIsValidMacAddress() {
        // Valid hardware MAC addresses
        assertTrue(WifiDirectManager.isValidMacAddress("4A:5E:60:11:22:33"));
        assertTrue(WifiDirectManager.isValidMacAddress("00:11:22:33:44:55"));
        assertTrue(WifiDirectManager.isValidMacAddress("aa:bb:cc:dd:ee:ff"));

        // Masked Android dummy MAC address (must be rejected)
        assertFalse(WifiDirectManager.isValidMacAddress("02:00:00:00:00:00"));
        assertFalse(WifiDirectManager.isValidMacAddress("02:00:00:00:00:00 "));

        // Null, empty, and invalid formats
        assertFalse(WifiDirectManager.isValidMacAddress(null));
        assertFalse(WifiDirectManager.isValidMacAddress(""));
        assertFalse(WifiDirectManager.isValidMacAddress("invalid-mac"));
        assertFalse(WifiDirectManager.isValidMacAddress("TEMP-12345678"));
        assertFalse(WifiDirectManager.isValidMacAddress("4A:5E:60:11:22"));
    }

    @Test
    public void testSetThisDeviceAddressFiltersMaskedAddresses() {
        WifiDirectManager manager = new WifiDirectManager(null, null, null);

        // Setting a masked MAC should be ignored
        manager.setThisDeviceAddress("02:00:00:00:00:00");
        assertNull("Masked MAC must not be stored as valid hardware address", manager.getThisDeviceAddress());

        // Setting a valid MAC should be stored
        manager.setThisDeviceAddress("5A:44:33:22:11:00");
        assertEquals("5A:44:33:22:11:00", manager.getThisDeviceAddress());

        // Attempting to overwrite with masked MAC should be rejected
        manager.setThisDeviceAddress("02:00:00:00:00:00");
        assertEquals("Valid MAC should not be overwritten by masked dummy MAC", "5A:44:33:22:11:00", manager.getThisDeviceAddress());
    }

    @Test
    public void testDeterministicTieBreakerWithValidMacs() {
        String macA = "6A:00:11:22:33:44";
        String macB = "4A:00:11:22:33:44";

        boolean aInitiates = macA.compareToIgnoreCase(macB) > 0;
        boolean bInitiates = macB.compareToIgnoreCase(macA) > 0;

        // Exactly one device initiates immediately
        assertTrue(aInitiates);
        assertFalse(bInitiates);
    }
}
