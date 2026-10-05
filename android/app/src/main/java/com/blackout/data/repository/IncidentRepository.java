package com.blackout.data.repository;

import com.blackout.data.dao.EmergencyReportDao;
import com.blackout.data.dao.IncidentDao;
import com.blackout.data.entity.EmergencyReportEntity;
import com.blackout.data.entity.IncidentEntity;
import com.blackout.data.intelligence.ConfidenceCalculator;
import com.blackout.data.intelligence.SpatialAggregator;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class IncidentRepository {

    private final IncidentDao incidentDao;
    private final EmergencyReportDao reportDao;

    public IncidentRepository(IncidentDao incidentDao, EmergencyReportDao reportDao) {
        this.incidentDao = incidentDao;
        this.reportDao = reportDao;
    }

    public void processReport(EmergencyReportEntity report) {
        // Save the raw report first (Data Loss Prevention)
        reportDao.insert(report);

        // 1. Find potential spatial matches
        List<IncidentEntity> activeIncidents = incidentDao.findByCategoryAndStatus(report.category, "OPEN");
        IncidentEntity matchedIncident = null;

        for (IncidentEntity incident : activeIncidents) {
            if (SpatialAggregator.matches(report, incident)) {
                matchedIncident = incident;
                break;
            }
        }

        if (matchedIncident == null) {
            // 2. Create a new incident if no match
            matchedIncident = new IncidentEntity();
            matchedIncident.incidentId = UUID.randomUUID().toString();
            matchedIncident.category = report.category;
            matchedIncident.title = report.category + " Reported";
            matchedIncident.summary = report.description;
            matchedIncident.locationJson = report.locationJson;
            matchedIncident.firstReportedAt = report.observedAt;
            matchedIncident.lastUpdatedAt = report.observedAt;
            matchedIncident.status = "OPEN";
            matchedIncident.severity = report.severity;
            
            // Link report to new incident
            report.incidentId = matchedIncident.incidentId;
            reportDao.insert(report); 
        } else {
            // Link report to existing incident
            report.incidentId = matchedIncident.incidentId;
            reportDao.insert(report);
            
            matchedIncident.lastUpdatedAt = Math.max(matchedIncident.lastUpdatedAt, report.observedAt);
        }

        // 3. Recalculate Confidence
        recalculateConfidence(matchedIncident);
    }

    private void recalculateConfidence(IncidentEntity incident) {
        List<EmergencyReportEntity> reports = reportDao.findByIncidentId(incident.incidentId);
        
        Set<String> uniqueDevices = new HashSet<>();
        int corroboratingReports = reports.size();
        boolean hasEvidence = false;
        long ageInMillis = System.currentTimeMillis() - incident.firstReportedAt;

        for (EmergencyReportEntity r : reports) {
            uniqueDevices.add(r.reporterDeviceId);
            if (r.evidenceIds != null && !r.evidenceIds.isEmpty()) {
                hasEvidence = true;
            }
        }

        double newConfidence = ConfidenceCalculator.calculate(
                uniqueDevices.size(),
                hasEvidence,
                corroboratingReports,
                ageInMillis,
                false, // trusted confirmation check to be implemented in future phase
                incident.contradictionCount
        );

        incident.confidenceLevel = String.valueOf(newConfidence);
        
        // Update independent sources
        incident.independentSourceCount = uniqueDevices.size();

        incidentDao.insert(incident); // Or update(incident)
    }
}
