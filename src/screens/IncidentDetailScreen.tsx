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
import { SeverityBadge } from '../components/SeverityBadge';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { StatusPill } from '../components/StatusPill';
import { SectionHeader } from '../components/SectionHeader';
import { ErrorState } from '../components/ErrorState';
import { NavIcon, NavIconName } from '../components/NavIcon';
import type { IncidentService } from '../services/IncidentService';
import type { IncidentStatus } from '../contracts/data/IncidentDto';
import type { Severity, VerificationLevel } from '../contracts/data/EmergencyReport';

interface IncidentDetailScreenProps {
  incidentId: string;
  incidentService: IncidentService;
  onBack: () => void;
}

const STATUS_OPTIONS: IncidentStatus[] = ['OPEN', 'MONITORING', 'RESOLVED', 'EXPIRED'];

const CATEGORY_ICON_MAP: Record<string, NavIconName> = {
  FIRE: 'FIRE',
  FLOOD: 'FLOOD',
  MEDICAL: 'MEDICAL',
  BUILDING_COLLAPSE: 'WARNING',
  TRAPPED_PERSON: 'WARNING',
  BLOCKED_ROAD: 'BLOCKED_ROAD',
  FOOD: 'Resources',
  WATER: 'WATER',
  SHELTER: 'SHELTER',
  OTHER: 'OTHER',
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

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'OPEN':
        return 'danger';
      case 'MONITORING':
        return 'warning';
      case 'RESOLVED':
        return 'active';
      case 'EXPIRED':
      default:
        return 'neutral';
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
          Loading Operational Overview...
        </Text>
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ErrorState
          message={error?.message || 'The requested incident does not exist in local storage.'}
          onRetry={onBack}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary, marginTop: 16 }]}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Return to Incident Directory</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const severityColor = getSeverityColor(incident.severity);
  const confidencePercent = getConfidencePercentage(incident.confidence_level);
  const categoryIcon = CATEGORY_ICON_MAP[incident.category] || 'OTHER';

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.navMeta}>
            <Text style={[styles.navIdText, { color: theme.colors.textMuted }]} numberOfLines={1}>
              INCIDENT #{incident.incident_id.slice(0, 10)}
            </Text>
          </View>
        </View>

        {/* 1. INCIDENT HERO SURFACE */}
        <View
          style={[
            styles.heroSurface,
            {
              backgroundColor: theme.colors.surface,
              borderColor: incident.severity === 'CRITICAL' ? theme.colors.severityCritical + '60' : theme.colors.surfaceBorder,
              borderLeftColor: severityColor,
            },
          ]}
        >
          {/* Eyebrow & Badges */}
          <View style={styles.heroEyebrowRow}>
            <View style={styles.heroCategoryGroup}>
              <NavIcon name={categoryIcon} color={severityColor} size={16} />
              <Text style={[styles.eyebrowText, { color: theme.colors.textMuted }]}>
                {incident.category}
              </Text>
            </View>
            <View style={styles.heroBadges}>
              <SeverityBadge severity={incident.severity} size="small" />
              <StatusPill label={incident.status} variant={getStatusVariant(incident.status)} showDot />
            </View>
          </View>

          {/* Primary Incident Title */}
          <Text style={[styles.heroTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {incident.title}
          </Text>

          {/* Description */}
          <Text style={[styles.heroSummary, { color: theme.colors.textSecondary }]}>
            {incident.summary}
          </Text>

          {/* Timestamps & Secondary Metadata */}
          <View style={[styles.heroMetaRow, { borderTopColor: theme.colors.surfaceBorder }]}>
            <View style={styles.metaInlineItem}>
              <NavIcon name="CLOCK" color={theme.colors.textMuted} size={12} />
              <Text style={[styles.metaInlineText, { color: theme.colors.textSecondary }]}>
                Reported {new Date(incident.first_reported_at).toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.metaInlineItem}>
              <NavIcon name="REFRESH" color={theme.colors.textMuted} size={12} />
              <Text style={[styles.metaInlineText, { color: theme.colors.textSecondary }]}>
                Updated {new Date(incident.last_updated_at).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. CONFIDENCE INTELLIGENCE SURFACE */}
        <View
          style={[
            styles.intelligenceSurface,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.surfaceBorder,
            },
          ]}
        >
          <View style={styles.intelligenceHeaderRow}>
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
                CONFIDENCE & TRUST SIGNAL
              </Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreValue, { color: theme.colors.textPrimary }]}>
                  {confidencePercent}%
                </Text>
                <ConfidenceBadge level={incident.confidence_level} size="medium" />
              </View>
            </View>
          </View>

          {/* Horizontal Confidence Track */}
          <View style={[styles.confidenceMeterTrack, { backgroundColor: theme.colors.surfaceBorder }]}>
            <View
              style={[
                styles.confidenceMeterFill,
                { width: `${confidencePercent}%`, backgroundColor: theme.colors.primary },
              ]}
            />
          </View>

          <Text style={[styles.sourceSubtext, { color: theme.colors.textSecondary }]}>
            Based on {incident.independent_source_count} independent P2P source report(s)
          </Text>

          {/* Operational Metrics Bar */}
          <View style={[styles.metricsBar, { backgroundColor: theme.colors.background }]}>
            <View style={styles.metricBarCell}>
              <Text style={[styles.metricBarValue, { color: theme.colors.textPrimary }]}>
                {incident.independent_source_count}
              </Text>
              <Text style={[styles.metricBarLabel, { color: theme.colors.textMuted }]}>SOURCES</Text>
            </View>
            <View style={[styles.metricBarDivider, { backgroundColor: theme.colors.surfaceBorder }]} />
            <View style={styles.metricBarCell}>
              <Text style={[styles.metricBarValue, { color: theme.colors.textPrimary }]}>
                {incident.evidence_count}
              </Text>
              <Text style={[styles.metricBarLabel, { color: theme.colors.textMuted }]}>EVIDENCE</Text>
            </View>
            <View style={[styles.metricBarDivider, { backgroundColor: theme.colors.surfaceBorder }]} />
            <View style={styles.metricBarCell}>
              <Text
                style={[
                  styles.metricBarValue,
                  { color: incident.contradiction_count > 0 ? theme.colors.severityCritical : theme.colors.textPrimary },
                ]}
              >
                {incident.contradiction_count}
              </Text>
              <Text style={[styles.metricBarLabel, { color: theme.colors.textMuted }]}>CONFLICTS</Text>
            </View>
          </View>

          {/* Rationale callout if available */}
          {confidence?.rationale ? (
            <View style={[styles.rationaleContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.rationaleTitle, { color: theme.colors.textPrimary }]}>
                WHY THIS SCORE?
              </Text>
              <Text style={[styles.rationaleBody, { color: theme.colors.textSecondary }]}>
                {confidence.rationale}
              </Text>
            </View>
          ) : null}

          {/* Advisory Disclaimer */}
          <View style={[styles.disclaimerBox, { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningBorder }]}>
            <Text style={[styles.disclaimerText, { color: theme.colors.warningText }]}>
              ⚠️ CONFIDENCE ≠ GUARANTEED TRUTH. Advisory offline heuristic score calculated from multi-source report density and evidence state.
            </Text>
          </View>
        </View>

        {/* 3. LOCATION SECTION */}
        <View style={styles.sectionDividerBlock}>
          <SectionHeader title="LOCATION" />
          {incident.location ? (
            <View style={styles.locationContentRow}>
              <NavIcon name="LOCATION" color={theme.colors.primary} size={18} />
              <View style={{ marginLeft: 10, flexShrink: 1 }}>
                <Text style={[styles.coordsText, { color: theme.colors.textPrimary }]}>
                  {incident.location.latitude.toFixed(5)}, {incident.location.longitude.toFixed(5)}
                </Text>
                <Text style={[styles.accuracyText, { color: theme.colors.textSecondary }]}>
                  GNSS Accuracy ±{incident.location.accuracy_m}m
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.secondaryBodyText, { color: theme.colors.textMuted }]}>
              No spatial coordinates attached to this incident.
            </Text>
          )}
        </View>

        {/* 4. CONTRADICTIONS SECTION */}
        <View style={styles.sectionDividerBlock}>
          <SectionHeader title="CONTRADICTIONS & CONFLICTS" />
          {incident.contradiction_count === 0 ? (
            <View style={styles.conflictCleanRow}>
              <NavIcon name="CHECK" color={theme.colors.confidenceConfirmed} size={16} />
              <Text style={[styles.conflictCleanText, { color: theme.colors.confidenceConfirmed }]}>
                NO CONFLICTING REPORTS — All available report updates are consistent.
              </Text>
            </View>
          ) : (
            <View style={[styles.conflictBanner, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerBorder }]}>
              <NavIcon name="WARNING" color={theme.colors.dangerText} size={18} />
              <View style={{ marginLeft: 10, flexShrink: 1 }}>
                <Text style={[styles.conflictTitle, { color: theme.colors.dangerText }]}>
                  {incident.contradiction_count} Conflicting Report(s) Flagged
                </Text>
                <Text style={[styles.conflictBody, { color: theme.colors.dangerText }]}>
                  Peer nodes reported conflicting severity or spatial updates. Verify before action.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 5. EVIDENCE LEDGER SECTION */}
        <View style={styles.sectionDividerBlock}>
          <View style={styles.sectionHeaderWithAction}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              EVIDENCE LEDGER ({evidenceList.length})
            </Text>
            <TouchableOpacity
              style={[styles.attachBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => addEvidenceItem('IMAGE', `file:///storage/emulated/0/BLACKOUT/ev_${Date.now()}.jpg`)}
              activeOpacity={0.8}
            >
              <NavIcon name="PLUS" color="#FFFFFF" size={12} />
              <Text style={styles.attachBtnText}>ADD EVIDENCE</Text>
            </TouchableOpacity>
          </View>

          {evidenceList.length === 0 ? (
            <Text style={[styles.secondaryBodyText, { color: theme.colors.textMuted }]}>
              No supporting media attached.
            </Text>
          ) : (
            <View style={styles.evidenceRowsList}>
              {evidenceList.map((item) => (
                <View
                  key={item.evidence_id}
                  style={[
                    styles.evidenceRowItem,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
                  ]}
                >
                  <NavIcon name="EVIDENCE" color={theme.colors.textMuted} size={16} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={styles.evidenceItemTop}>
                      <Text style={[styles.evidenceType, { color: theme.colors.primary }]}>
                        [{item.type}]
                      </Text>
                      <Text style={[styles.evidenceState, { color: theme.colors.textSecondary }]}>
                        {item.analysis_state}
                      </Text>
                    </View>
                    <Text style={[styles.evidenceUri, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {item.local_uri || 'No local URI'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 6. INCIDENT LIFECYCLE STATUS SECTION */}
        <View style={styles.sectionDividerBlock}>
          <SectionHeader title="INCIDENT STATUS" />

          {/* Operational Timeline Progress Selector */}
          <View style={styles.timelineContainer}>
            {STATUS_OPTIONS.map((statusOpt, index) => {
              const isSelected = incident.status === statusOpt;
              return (
                <TouchableOpacity
                  key={statusOpt}
                  style={styles.timelineStep}
                  onPress={() => updateStatus(statusOpt)}
                  activeOpacity={0.8}
                >
                  <View style={styles.stepIndicatorRow}>
                    <View
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.textMuted,
                        },
                      ]}
                    >
                      {isSelected && <View style={styles.stepInnerDot} />}
                    </View>
                    {index < STATUS_OPTIONS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder },
                        ]}
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: { fontSize: 13, fontWeight: '600' },
  navMeta: { flexShrink: 1, marginLeft: 12 },
  navIdText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  heroSurface: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroCategoryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 8,
  },
  heroSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  heroMetaRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaInlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaInlineText: {
    fontSize: 11,
    fontWeight: '500',
  },
  intelligenceSurface: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  intelligenceHeaderRow: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  confidenceMeterTrack: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    marginVertical: 10,
    overflow: 'hidden',
  },
  confidenceMeterFill: {
    height: '100%',
    borderRadius: 4,
  },
  sourceSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  metricBarCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricBarValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricBarLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metricBarDivider: {
    width: 1,
    height: 20,
  },
  rationaleContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  rationaleTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rationaleBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  disclaimerBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  disclaimerText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  sectionDividerBlock: {
    paddingTop: 14,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  locationContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  coordsText: {
    fontSize: 15,
    fontWeight: '700',
  },
  accuracyText: {
    fontSize: 12,
    marginTop: 2,
  },
  secondaryBodyText: {
    fontSize: 13,
    marginTop: 4,
  },
  conflictCleanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  conflictCleanText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  conflictTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  conflictBody: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    minHeight: 36,
    justifyContent: 'center',
  },
  attachBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  evidenceRowsList: {
    marginTop: 8,
    gap: 8,
  },
  evidenceRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  evidenceItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evidenceType: {
    fontSize: 11,
    fontWeight: '700',
  },
  evidenceState: {
    fontSize: 10,
    fontWeight: '600',
  },
  evidenceUri: {
    fontSize: 12,
    marginTop: 2,
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  stepLine: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 2,
    top: 7,
    zIndex: 1,
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
