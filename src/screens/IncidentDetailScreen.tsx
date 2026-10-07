import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useIncidentDetail } from '../hooks/useIncidentDetail';
import type { IncidentService } from '../services/IncidentService';
import type { IncidentStatus } from '../contracts/data/IncidentDto';
import type { Severity, VerificationLevel } from '../contracts/data/EmergencyReport';

interface IncidentDetailScreenProps {
  incidentId: string;
  incidentService: IncidentService;
  onBack: () => void;
}

const STATUS_OPTIONS: IncidentStatus[] = ['OPEN', 'MONITORING', 'RESOLVED', 'EXPIRED'];

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  FIRE: '🔥',
  FLOOD: '🌊',
  MEDICAL: '🚑',
  BUILDING_COLLAPSE: '🏗️',
  TRAPPED_PERSON: '🆘',
  BLOCKED_ROAD: '🚧',
  FOOD: '🍲',
  WATER: '💧',
  SHELTER: '⛺',
  OTHER: '⚠️',
};

export const IncidentDetailScreen: React.FC<IncidentDetailScreenProps> = ({
  incidentId,
  incidentService,
  onBack,
}) => {
  const { theme } = useTheme();
  const {
    incident,
    confidence,
    evidenceList,
    isLoading,
    error,
    updateStatus,
    addEvidenceItem,
  } = useIncidentDetail(incidentService, incidentId);

  const getSeverityColor = (severity?: Severity) => {
    switch (severity) {
      case 'CRITICAL':
        return theme.colors.severityCritical;
      case 'HIGH':
        return theme.colors.severityHigh;
      case 'MEDIUM':
        return theme.colors.severityMedium;
      case 'LOW':
        return theme.colors.severityLow;
      default:
        return theme.colors.severityUnknown;
    }
  };

  const getConfidenceColor = (level?: VerificationLevel) => {
    switch (level) {
      case 'CONFIRMED':
        return theme.colors.confidenceConfirmed;
      case 'HIGH_CONFIDENCE':
        return theme.colors.confidenceHigh;
      case 'LIKELY':
        return theme.colors.confidenceLikely;
      case 'UNVERIFIED':
      default:
        return theme.colors.confidenceUnverified;
    }
  };

  const getConfidencePercentage = (level?: VerificationLevel) => {
    switch (level) {
      case 'CONFIRMED':
        return 100;
      case 'HIGH_CONFIDENCE':
        return 80;
      case 'LIKELY':
        return 55;
      case 'UNVERIFIED':
      default:
        return 25;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading Incident Overview...
        </Text>
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.dangerBg }]}>
          <Text style={styles.iconCircleText}>⚠️</Text>
        </View>
        <Text style={[styles.errorTitle, { color: theme.colors.textPrimary }]}>
          Incident Not Found
        </Text>
        <Text style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
          {error?.message || 'The requested incident does not exist in local storage.'}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Return to Incident Ledger</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const severityColor = getSeverityColor(incident.severity);
  const confidenceColor = getConfidenceColor(incident.confidence_level);
  const confidencePercent = getConfidencePercentage(incident.confidence_level);
  const categoryEmoji = CATEGORY_EMOJI_MAP[incident.category] || '⚠️';

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Navigation Bar */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.navIdText, { color: theme.colors.textSecondary }]}>
            INCIDENT ID #{incident.incident_id}
          </Text>
        </View>

        {/* 1. Hero Emergency Header Surface */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: incident.severity === 'CRITICAL' ? theme.colors.severityCritical + '60' : theme.colors.surfaceBorder,
              borderLeftColor: severityColor,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={[styles.severityTag, { backgroundColor: severityColor }]}>
              <Text style={styles.severityTagText}>{incident.severity}</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: theme.colors.primary + '18', borderColor: theme.colors.primary }]}>
              <Text style={[styles.statusTagText, { color: theme.colors.primary }]}>{incident.status}</Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]}>
            {categoryEmoji} {incident.title}
          </Text>

          <Text style={[styles.heroSummary, { color: theme.colors.textSecondary }]}>
            {incident.summary}
          </Text>

          <View style={[styles.heroMetaRow, { borderTopColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.heroMetaText, { color: theme.colors.textSecondary }]}>
              ⏱️ First Reported: {new Date(incident.first_reported_at).toLocaleTimeString()}
            </Text>
            <Text style={[styles.heroMetaText, { color: theme.colors.textSecondary }]}>
              🔄 Updated: {new Date(incident.last_updated_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* 2. Location Information Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>📍 Incident Location</Text>
          {incident.location ? (
            <View style={styles.locationContainer}>
              <Text style={[styles.locationCoords, { color: theme.colors.textPrimary }]}>
                {incident.location.latitude.toFixed(5)}, {incident.location.longitude.toFixed(5)}
              </Text>
              <Text style={[styles.locationMeta, { color: theme.colors.textSecondary }]}>
                GNSS Accuracy Radius: ±{incident.location.accuracy_m} meters
              </Text>
            </View>
          ) : (
            <Text style={[styles.bodyText, { color: theme.colors.textSecondary }]}>
              No spatial coordinates attached to this incident.
            </Text>
          )}
        </View>

        {/* 3. Visual Confidence & Aggregation System */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>📊 Confidence & Aggregation</Text>
            <Text style={[styles.confidenceLevelText, { color: confidenceColor }]}>
              {incident.confidence_level.replace('_', ' ')}
            </Text>
          </View>

          {/* Visual Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceBorder }]}>
            <View style={[styles.fillBar, { width: `${confidencePercent}%`, backgroundColor: confidenceColor }]} />
          </View>

          {/* Core Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={[styles.gridCell, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.gridCellLabel, { color: theme.colors.textSecondary }]}>Independent Sources</Text>
              <Text style={[styles.gridCellValue, { color: theme.colors.textPrimary }]}>{incident.independent_source_count}</Text>
            </View>
            <View style={[styles.gridCell, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.gridCellLabel, { color: theme.colors.textSecondary }]}>Supporting Evidence</Text>
              <Text style={[styles.gridCellValue, { color: theme.colors.textPrimary }]}>{incident.evidence_count}</Text>
            </View>
            <View style={[styles.gridCell, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.gridCellLabel, { color: theme.colors.textSecondary }]}>Flagged Contradictions</Text>
              <Text style={[styles.gridCellValue, { color: incident.contradiction_count > 0 ? theme.colors.severityCritical : theme.colors.textPrimary }]}>
                {incident.contradiction_count}
              </Text>
            </View>
          </View>

          {confidence?.rationale && (
            <View style={[styles.rationaleBox, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.rationaleTitle, { color: theme.colors.textPrimary }]}>Engine Rationale:</Text>
              <Text style={[styles.rationaleText, { color: theme.colors.textSecondary }]}>{confidence.rationale}</Text>
            </View>
          )}

          {/* Disclaimer callout */}
          <View style={[styles.disclaimerCallout, { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningBorder }]}>
            <Text style={[styles.disclaimerText, { color: theme.colors.warningText }]}>
              ⚠️ CONFIDENCE ≠ GUARANTEED TRUTH. Confidence represents an offline P2P heuristic score calculated from multi-source report density and media verification.
            </Text>
          </View>
        </View>

        {/* 4. Contradictions Section */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>⚠️ Contradictions & Conflicts</Text>
          {incident.contradiction_count === 0 ? (
            <View style={styles.cleanRow}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={[styles.bodyText, { color: theme.colors.textSecondary }]}>
                No conflicting reports or spatial discrepancies reported for this incident.
              </Text>
            </View>
          ) : (
            <View style={[styles.contradictionBanner, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerBorder }]}>
              <Text style={[styles.contradictionTitle, { color: theme.colors.dangerText }]}>
                ⚠️ {incident.contradiction_count} Conflicting Report(s) Flagged
              </Text>
              <Text style={[styles.contradictionSubtext, { color: theme.colors.dangerText }]}>
                One or more peer nodes reported conflicting severity or location updates. Verify evidence before taking field action.
              </Text>
            </View>
          )}
        </View>

        {/* 5. Supporting Evidence Experience */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>
              📷 Evidence Ledger ({evidenceList.length})
            </Text>
            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => addEvidenceItem('IMAGE', `file:///storage/emulated/0/BLACKOUT/ev_${Date.now()}.jpg`)}
              activeOpacity={0.8}
            >
              <Text style={styles.smallBtnText}>+ Attach Evidence</Text>
            </TouchableOpacity>
          </View>

          {evidenceList.length === 0 ? (
            <Text style={[styles.bodyText, { color: theme.colors.textSecondary, marginTop: 12 }]}>
              No supporting media files attached to this incident.
            </Text>
          ) : (
            <View style={styles.evidenceListContainer}>
              {evidenceList.map((item) => (
                <View key={item.evidence_id} style={[styles.evidenceTile, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
                  {/* Media Placeholder Surface */}
                  <View style={[styles.mediaPlaceholder, { backgroundColor: theme.colors.surfaceBorder }]}>
                    <Text style={styles.mediaPlaceholderIcon}>📷</Text>
                  </View>
                  <View style={styles.evidenceDetails}>
                    <View style={styles.evidenceTopRow}>
                      <Text style={[styles.evidenceTypeTag, { color: theme.colors.primary }]}>[{item.type}]</Text>
                      <Text style={[styles.evidenceStatus, { color: item.analysis_state === 'COMPLETE' ? theme.colors.confidenceConfirmed : theme.colors.textSecondary }]}>
                        {item.analysis_state}
                      </Text>
                    </View>
                    <Text style={[styles.evidenceUriText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {item.local_uri || 'No local URI'}
                    </Text>
                    <Text style={[styles.evidenceMetaText, { color: theme.colors.textSecondary }]}>
                      Source Node: {item.source_device_id.slice(0, 12)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 6. Incident Status Control */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>⚙️ Incident Lifecycle Status</Text>
          <View style={styles.statusChipGroup}>
            {STATUS_OPTIONS.map((statusOpt) => {
              const isSelected = incident.status === statusOpt;
              return (
                <TouchableOpacity
                  key={statusOpt}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => updateStatus(statusOpt)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {statusOpt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconCircleText: { fontSize: 24 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  errorSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 16, maxWidth: 280 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  backButtonText: { fontSize: 13, fontWeight: '600' },
  navIdText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  heroCard: { padding: 18, borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, marginBottom: 14 },
  heroTopRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  severityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityTagText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  statusTagText: { fontSize: 10, fontWeight: '700' },
  heroTitle: { fontSize: 20, fontWeight: '800', lineHeight: 26, marginBottom: 6 },
  heroSummary: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  heroMetaRow: { paddingTop: 10, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between' },
  heroMetaText: { fontSize: 11, fontWeight: '500' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  locationContainer: { padding: 10, borderRadius: 8, backgroundColor: '#00000005' },
  locationCoords: { fontSize: 14, fontWeight: '700' },
  locationMeta: { fontSize: 12, marginTop: 2 },
  confidenceLevelText: { fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 8, borderRadius: 4, width: '100%', marginBottom: 14, overflow: 'hidden' },
  fillBar: { height: '100%', borderRadius: 4 },
  metricsGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  gridCell: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  gridCellLabel: { fontSize: 10, textAlign: 'center', marginBottom: 2 },
  gridCellValue: { fontSize: 16, fontWeight: '800' },
  rationaleBox: { padding: 10, borderRadius: 8, marginBottom: 12 },
  rationaleTitle: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  rationaleText: { fontSize: 12, lineHeight: 16 },
  disclaimerCallout: { padding: 10, borderRadius: 8, borderWidth: 1 },
  disclaimerText: { fontSize: 11, fontWeight: '600', lineHeight: 15 },
  bodyText: { fontSize: 13, lineHeight: 18 },
  cleanRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkIcon: { fontSize: 14, color: '#10B981', fontWeight: '800' },
  contradictionBanner: { padding: 12, borderRadius: 8, borderWidth: 1 },
  contradictionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  contradictionSubtext: { fontSize: 12, lineHeight: 16 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  smallBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  evidenceListContainer: { marginTop: 10, gap: 10 },
  evidenceTile: { flexDirection: 'row', padding: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', gap: 10 },
  mediaPlaceholder: { width: 40, height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  mediaPlaceholderIcon: { fontSize: 18 },
  evidenceDetails: { flex: 1 },
  evidenceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  evidenceTypeTag: { fontSize: 11, fontWeight: '700' },
  evidenceStatus: { fontSize: 10, fontWeight: '700' },
  evidenceUriText: { fontSize: 12, fontWeight: '600' },
  evidenceMetaText: { fontSize: 10 },
  statusChipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  statusChipText: { fontSize: 12 },
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});

