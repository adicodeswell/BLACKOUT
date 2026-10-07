import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useEmergencyReport } from '../hooks/useEmergencyReport';
import { RuleBasedAIEngine } from '../services/RuleBasedAIEngine';
import { AISuggestionCard } from '../components/AISuggestionCard';
import type { ReportCategory, Severity } from '../contracts/data/EmergencyReport';
import type { EmergencyReportService } from '../services/EmergencyReportService';
import type { ReportClassification } from '../contracts/ai/AIContracts';

interface EmergencyReportScreenProps {
  reportService: EmergencyReportService;
  onBack?: () => void;
}

const CATEGORIES: Array<{ label: string; value: ReportCategory }> = [
  { label: '🔥 Fire', value: 'FIRE' },
  { label: '🌊 Flood', value: 'FLOOD' },
  { label: '🚑 Medical', value: 'MEDICAL' },
  { label: '🏗️ Collapse', value: 'BUILDING_COLLAPSE' },
  { label: '🆘 Trapped', value: 'TRAPPED_PERSON' },
  { label: '🚧 Blocked Road', value: 'BLOCKED_ROAD' },
  { label: '🍲 Food', value: 'FOOD' },
  { label: '💧 Water', value: 'WATER' },
  { label: '⛺ Shelter', value: 'SHELTER' },
  { label: '⚠️ Other', value: 'OTHER' },
];

const SEVERITIES: Array<{ label: string; value: Severity }> = [
  { label: 'Unknown', value: 'UNKNOWN' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

export const EmergencyReportScreen: React.FC<EmergencyReportScreenProps> = ({
  reportService,
  onBack,
}) => {
  const { theme } = useTheme();
  const {
    category,
    setCategory,
    severity,
    setSeverity,
    description,
    setDescription,
    attachLocation,
    setAttachLocation,
    locationState,
    evidenceItems,
    addEvidenceMetadata,
    removeEvidenceMetadata,
    validationErrors,
    submissionState,
    submitReport,
    resetForm,
  } = useEmergencyReport(reportService);

  const aiEngine = useMemo(() => new RuleBasedAIEngine(), []);
  const [aiSuggestion, setAiSuggestion] = useState<ReportClassification | null>(null);
  const [dismissedAi, setDismissedAi] = useState(false);

  // Debounced AI text classification
  useEffect(() => {
    if (!description || description.trim().length < 5 || dismissedAi) {
      setAiSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await aiEngine.classifyReport({
        report_id: `draft-${Date.now()}`,
        text: description,
      });

      if (res.ok && res.data.confidence >= 0.5 && res.data.category !== 'OTHER') {
        setAiSuggestion(res.data);
      } else {
        setAiSuggestion(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [description, dismissedAi, aiEngine]);

  const handleApplyAiSuggestion = (sugCat: string, sugSev?: string) => {
    setCategory(sugCat as ReportCategory);
    if (sugSev) {
      setSeverity(sugSev as Severity);
    }
    setAiSuggestion(null);
    setDismissedAi(true);
  };

  const handleDismissAiSuggestion = () => {
    setAiSuggestion(null);
    setDismissedAi(true);
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    if (dismissedAi) {
      setDismissedAi(false);
    }
  };

  const isSubmitting = submissionState.status === 'SUBMITTING';
  const isSavedLocally = submissionState.status === 'LOCAL_SAVED';
  const hasSubmissionError = submissionState.status === 'ERROR';

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.backButton, { borderColor: theme.colors.surfaceBorder }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.screenTitle, { color: theme.colors.textPrimary }]}>Report Emergency</Text>
        </View>

        {/* Local Save Success Banner */}
        {isSavedLocally && (
          <View style={[styles.banner, styles.successBanner]}>
            <Text style={styles.successBannerTitle}>✓ Report Saved Locally</Text>
            <Text style={styles.bannerSubtitle}>
              Your report is persisted on this device.
            </Text>

            {submissionState.broadcastAttempted && (
              <View style={styles.networkStatusBox}>
                {submissionState.deliveryHandle ? (
                  <Text style={styles.networkStatusText}>
                    📡 P2P Broadcast Accepted (ID: {submissionState.deliveryHandle.message_id.slice(0, 8)}...)
                  </Text>
                ) : submissionState.networkError ? (
                  <Text style={styles.networkErrorText}>
                    ⚠️ Broadcast Pending: {submissionState.networkError.message} (Will retry when peers are nearby)
                  </Text>
                ) : (
                  <Text style={styles.networkStatusText}>📡 Broadcasting to nearby peers...</Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary, marginTop: 12 }]}
              onPress={() => {
                resetForm();
                setDismissedAi(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Submit Another Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Global Submission Error Banner */}
        {hasSubmissionError && submissionState.error && (
          <View style={[styles.banner, styles.errorBanner]}>
            <Text style={styles.errorBannerTitle}>⚠️ Local Save Failed</Text>
            <Text style={styles.bannerSubtitle}>{submissionState.error.message}</Text>
          </View>
        )}

        {/* Form Container */}
        {!isSavedLocally && (
          <View style={styles.formContainer}>
            {/* 1. Category Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                1. Category <Text style={styles.requiredMark}>*</Text>
              </Text>
              {validationErrors.category && (
                <Text style={styles.fieldErrorText}>{validationErrors.category}</Text>
              )}
              <View style={styles.chipGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                        },
                      ]}
                      onPress={() => setCategory(cat.value)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Severity Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>2. Severity</Text>
              <View style={styles.chipGrid}>
                {SEVERITIES.map((sev) => {
                  const isSelected = severity === sev.value;
                  const isCritical = sev.value === 'CRITICAL';
                  return (
                    <TouchableOpacity
                      key={sev.value}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? isCritical
                              ? theme.colors.primaryDanger
                              : theme.colors.primary
                            : theme.colors.surface,
                          borderColor: isSelected
                            ? isCritical
                              ? theme.colors.primaryDanger
                              : theme.colors.primary
                            : theme.colors.surfaceBorder,
                        },
                      ]}
                      onPress={() => setSeverity(sev.value)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary },
                        ]}
                      >
                        {sev.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Description Input */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                3. Description <Text style={styles.requiredMark}>*</Text>
              </Text>
              {validationErrors.description && (
                <Text style={styles.fieldErrorText}>{validationErrors.description}</Text>
              )}
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: validationErrors.description
                      ? theme.colors.primaryDanger
                      : theme.colors.surfaceBorder,
                    color: theme.colors.textPrimary,
                  },
                ]}
                placeholder="Describe what happened, required assistance, or immediate hazards..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={handleDescriptionChange}
                textAlignVertical="top"
              />

              {/* Advisory AI Suggestion Card */}
              {aiSuggestion && (
                <AISuggestionCard
                  suggestion={aiSuggestion}
                  onApply={handleApplyAiSuggestion}
                  onDismiss={handleDismissAiSuggestion}
                />
              )}
            </View>

            {/* 4. Location Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
              <View style={styles.switchRow}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>
                  📍 Attach Current Location
                </Text>
                <Switch
                  value={attachLocation}
                  onValueChange={setAttachLocation}
                  thumbColor={attachLocation ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>

              {attachLocation && (
                <View style={styles.locationStatusContainer}>
                  {locationState.status === 'LOADING' && (
                    <View style={styles.row}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={[styles.statusText, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
                        Acquiring GPS Fix...
                      </Text>
                    </View>
                  )}

                  {locationState.status === 'SUCCESS' && locationState.location && (
                    <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>
                      Lat: {locationState.location.latitude.toFixed(4)}, Long:{' '}
                      {locationState.location.longitude.toFixed(4)}
                      {locationState.location.accuracy_m ? ` (±${locationState.location.accuracy_m}m)` : ''}
                    </Text>
                  )}

                  {locationState.status === 'ERROR' && locationState.error && (
                    <Text style={styles.fieldErrorText}>
                      Location warning: {locationState.error.message} (Report can still be submitted)
                    </Text>
                  )}

                  {locationState.status === 'IDLE' && (
                    <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                      Location will be requested upon submission.
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* 5. Evidence Section */}
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
              <View style={styles.switchRow}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginBottom: 0 }]}>
                  📷 Evidence Metadata
                </Text>
                <TouchableOpacity
                  style={[styles.smallAddBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => addEvidenceMetadata({ type: 'TEXT', local_uri: `Note: ${description.slice(0, 30)}...` })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.smallAddBtnText}>+ Add Field Note</Text>
                </TouchableOpacity>
              </View>

              {evidenceItems.length === 0 ? (
                <Text style={[styles.statusText, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                  No evidence metadata attached.
                </Text>
              ) : (
                evidenceItems.map((item, idx) => (
                  <View key={idx} style={styles.evidenceRow}>
                    <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>
                      [{item.type}] {item.local_uri}
                    </Text>
                    <TouchableOpacity onPress={() => removeEvidenceMetadata(idx)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* 6. Review & Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: severity === 'CRITICAL' ? theme.colors.primaryDanger : theme.colors.primary,
                  opacity: isSubmitting ? 0.6 : 1,
                },
              ]}
              onPress={submitReport}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Emergency Report</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  formContainer: {
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  requiredMark: {
    color: '#DC3545',
  },
  fieldErrorText: {
    color: '#DC3545',
    fontSize: 12,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  textArea: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  smallAddBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  locationStatusContainer: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  removeText: {
    color: '#DC3545',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  banner: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  successBanner: {
    backgroundColor: '#19875420',
    borderColor: '#198754',
    borderWidth: 1,
  },
  successBannerTitle: {
    color: '#198754',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorBanner: {
    backgroundColor: '#DC354520',
    borderColor: '#DC3545',
    borderWidth: 1,
  },
  errorBannerTitle: {
    color: '#DC3545',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#495057',
  },
  networkStatusBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFFFFF60',
    borderRadius: 6,
  },
  networkStatusText: {
    fontSize: 13,
    color: '#0D6EFD',
    fontWeight: '500',
  },
  networkErrorText: {
    fontSize: 13,
    color: '#FD7E14',
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
