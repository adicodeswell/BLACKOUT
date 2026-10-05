package com.blackout.data.intelligence;

import com.blackout.data.entity.EmergencyReportEntity;
import com.blackout.data.entity.IncidentEntity;

import org.junit.Test;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class IntelligenceEngineTest {

    private static final double DELTA = 0.001;

    @Test
    public void testConfidenceCalculator_SaturationCaps() {
        // 10 unique devices should cap independence at 0.35 (10 * 0.07 = 0.70 > 0.35)
        // 10 reports should cap corroboration at 0.20 (10 * 0.04 = 0.40 > 0.20)
        double score = ConfidenceCalculator.calculate(
                10,     // devices
                false,  // no evidence
                10,     // reports
                0L,     // brand new
                false,  // not trusted
                0       // no contradictions
        );
        
        // 0.35 (ind) + 0.20 (cor) + 0.10 (fresh) = 0.65
        assertEquals(0.65, score, DELTA);
    }

    @Test
    public void testConfidenceCalculator_WithEvidenceAndTrusted() {
        double score = ConfidenceCalculator.calculate(
                5,      // devices -> 0.35
                true,   // evidence -> +0.25
                5,      // reports -> +0.20
                0L,     // fresh -> +0.10
                true,   // trusted -> +0.10
                0       // no contradiction
        );
        
        // Total = 0.35 + 0.25 + 0.20 + 0.10 + 0.10 = 1.0
        assertEquals(1.0, score, DELTA);
    }

    @Test
    public void testConfidenceCalculator_ContradictionPenalty() {
        // Assume score is 1.0 base
        double score = ConfidenceCalculator.calculate(
                5, true, 5, 0L, true, 2 // 2 contradictions!
        );
        
        // 1.0 - (2 * 0.20) = 0.60
        assertEquals(0.60, score, DELTA);
    }
    
    @Test
    public void testConfidenceCalculator_AgeDecay() {
        long twelveHours = 12 * 60 * 60 * 1000L;
        double score = ConfidenceCalculator.calculate(
                5, false, 5, twelveHours, false, 0
        );
        // freshness should be 0.05 instead of 0.10
        // ind 0.35 + cor 0.20 + 0.05 = 0.60
        assertEquals(0.60, score, DELTA);
    }

    @Test
    public void testSpatialAggregator_Within50Meters() {
        EmergencyReportEntity report = new EmergencyReportEntity();
        report.category = "FIRE";
        report.locationJson = "{\"latitude\": 40.7128, \"longitude\": -74.0060}";
        
        IncidentEntity incident = new IncidentEntity();
        incident.category = "FIRE";
        // About 30 meters away
        incident.locationJson = "{\"latitude\": 40.7129, \"longitude\": -74.0060}";
        
        assertTrue(SpatialAggregator.matches(report, incident));
    }
    
    @Test
    public void testSpatialAggregator_Outside50Meters() {
        EmergencyReportEntity report = new EmergencyReportEntity();
        report.category = "FIRE";
        report.locationJson = "{\"latitude\": 40.7128, \"longitude\": -74.0060}";
        
        IncidentEntity incident = new IncidentEntity();
        incident.category = "FIRE";
        // Way far away (e.g., different block)
        incident.locationJson = "{\"latitude\": 40.7200, \"longitude\": -74.0060}";
        
        assertFalse(SpatialAggregator.matches(report, incident));
    }
    
    @Test
    public void testSpatialAggregator_DifferentCategory() {
        EmergencyReportEntity report = new EmergencyReportEntity();
        report.category = "FLOOD";
        report.locationJson = "{\"latitude\": 40.7128, \"longitude\": -74.0060}";
        
        IncidentEntity incident = new IncidentEntity();
        incident.category = "FIRE";
        incident.locationJson = "{\"latitude\": 40.7128, \"longitude\": -74.0060}";
        
        assertFalse(SpatialAggregator.matches(report, incident)); // Exactly same location but diff category
    }
}
