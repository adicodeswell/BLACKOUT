package com.blackout.data.converters;

import org.junit.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

public class RoomConvertersTest {

    @Test
    public void testStringListToJsonAndBack() {
        List<String> original = Arrays.asList("evidence-1", "evidence-2", "evidence-3");
        String json = RoomConverters.stringListToJson(original);
        
        // Ensure it serialized to a JSON array string
        assertTrue(json.contains("evidence-1"));
        assertTrue(json.contains("evidence-2"));

        List<String> restored = RoomConverters.jsonToStringList(json);
        
        // Ensure it deserialized correctly
        assertEquals(3, restored.size());
        assertEquals(original, restored);
    }

    @Test
    public void testNullHandling() {
        assertNull(RoomConverters.stringListToJson(null));
        assertNull(RoomConverters.jsonToStringList(null));
    }
    
    @Test
    public void testEmptyList() {
        List<String> original = Arrays.asList();
        String json = RoomConverters.stringListToJson(original);
        List<String> restored = RoomConverters.jsonToStringList(json);
        
        assertEquals(0, restored.size());
    }
}
