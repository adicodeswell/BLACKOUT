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
import { SeverityBadge } from '../components/SeverityBadge';

import { PrimaryButton } from '../components/PrimaryButton';
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

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

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

  const handleStep1Next = () => {
    if (!category) return;
    setWizardStep(2);
  };

  const handleStep2Next = () => {
    if (!description || description.trim().length < 5) return;
    setWizardStep(3);
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
              <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.screenTitle, { color: theme.colors.textPrimary }]}>Report Emergency</Text>
        </View>

        {/* 3-Step Wizard Visual Progress Bar */}
        {!isSavedLocally && (
          <View style={[styles.progressCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <View style={styles.progressRow}>
              <TouchableOpacity
                style={[
                  styles.stepBadge,
                  wizardStep === 1 && { backgroundColor: theme.colors.primary },
                  category ? styles.stepBadgeCompleted : null,
                ]}
                onPress={() => setWizardStep(1)}
              >
                <Text style={styles.stepBadgeText}>{category ? '✓ 01' : '01'}</Text>
              </TouchableOpacity>
              <Text style={[styles.stepLabel, { color: wizardStep === 1 ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                Category
              </Text>

              <View style={[styles.progressLine, { backgroundColor: wizardStep >= 2 ? theme.colors.primary : theme.colors.surfaceBorder }]} />

              <TouchableOpacity
                style={[
                  styles.stepBadge,
                  wizardStep === 2 && { backgroundColor: theme.colors.primary },
                  description && description.trim().length >= 5 ? styles.stepBadgeCompleted : null,
                ]}
                onPress={() => category && setWizardStep(2)}
              >
                <Text style={styles.stepBadgeText}>{description && description.trim().length >= 5 ? '✓ 02' : '02'}</Text>
              </TouchableOpacity>
              <Text style={[styles.stepLabel, { color: wizardStep === 2 ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                Details
              </Text>

              <View style={[styles.progressLine, { backgroundColor: wizardStep === 3 ? theme.colors.primary : theme.colors.surfaceBorder }]} />

              <TouchableOpacity
                style={[styles.stepBadge, wizardStep === 3 && { backgroundColor: theme.colors.primary }]}
                onPress={() => category && description && setWizardStep(3)}
              >
                <Text style={styles.stepBadgeText}>03</Text>
              </TouchableOpacity>
              <Text style={[styles.stepLabel, { color: wizardStep === 3 ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                Review
              </Text>
            </View>
          </View>
        )}

        {/* Local Save Success Banner / Modal Card */}
        {isSavedLocally && (
          <View style={[styles.banner, styles.successBanner]}>
            <Text style={styles.successBannerTitle}>✓ Report Saved Locally</Text>
            <Text style={styles.bannerSubtitle}>
              Your emergency report has been persisted to local Room SQLite storage.
            </Text>

            {submissionState.broadcastAttempted && (
              <View style={styles.networkStatusBox}>
                {submissionState.deliveryHandle ? (
                  <Text style={styles.networkStatusText}>
                    📡 P2P Mesh Broadcast Accepted (ID: {submissionState.deliveryHandle.message_id.slice(0, 8)}...)
                  </Text>
                ) : submissionState.networkError ? (
                  <Text style={styles.networkErrorText}>
                    ⚠️ Broadcast Pending: {submissionState.networkError.message} (Will retry automatically when radio peers connect)
                  </Text>
                ) : (
                  <Text style={styles.networkStatusText}>📡 Broadcasting to nearby mesh nodes...</Text>
                )}
              </View>
            )}

            <PrimaryButton
              title="Submit Another Report"
              onPress={() => {
                resetForm();
                setWizardStep(1);
                setDismissedAi(false);
              }}
              style={{ marginTop: 16 }}
            />
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
            {/* STEP 1: CATEGORY */}
            {wizardStep === 1 && (
              <View style={styles.section}>
                <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
                  Step 1: Select Emergency Category <Text style={styles.requiredMark}>*</Text>
                </Text>
                <Text style={[styles.stepHint, { color: theme.colors.textSecondary }]}>
                  Choose the primary nature of the emergency situation.
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
                          styles.categoryCard,
                          {
                            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                            borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                          },
                        ]}
                        onPress={() => setCategory(cat.value)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.categoryText, { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary }]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <PrimaryButton
                  title="Continue to Details →"
                  onPress={handleStep1Next}
                  disabled={!category}
                  style={{ marginTop: 24 }}
                />
              </View>
            )}

            {/* STEP 2: DETAILS */}
            {wizardStep === 2 && (
              <View style={styles.section}>
                <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
                  Step 2: Emergency Details & Location <Text style={styles.requiredMark}>*</Text>
                </Text>
                <Text style={[styles.stepHint, { color: theme.colors.textSecondary }]}>
                  Describe the emergency, set severity, and attach optional location.
                </Text>

                {/* Description Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                    Description <Text style={styles.requiredMark}>*</Text>
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

                {/* Severity Selector */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>Assigned Severity</Text>
                  <View style={styles.chipGrid}>
                    {SEVERITIES.map((sev) => {
                      const isSelected = severity === sev.value;
                      const isCritical = sev.value === 'CRITICAL';
                      return (
                        <TouchableOpacity
                          key={sev.value}
                          style={[
                            styles.severityChip,
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

                {/* Location Attachment */}
                <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                  <View style={styles.switchRow}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textPrimary, marginBottom: 0 }]}>
                      📍 Attach Location
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
                          Location warning: {locationState.error.message} (Report will submit with default location)
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Evidence Metadata Section */}
                <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                  <View style={styles.switchRow}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textPrimary, marginBottom: 0 }]}>
                      📷 Field Note Metadata
                    </Text>
                    <TouchableOpacity
                      style={[styles.smallAddBtn, { backgroundColor: theme.colors.primary }]}
                      onPress={() => addEvidenceMetadata({ type: 'TEXT', local_uri: `Field note: ${description.slice(0, 30)}...` })}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.smallAddBtnText}>+ Add Note</Text>
                    </TouchableOpacity>
                  </View>

                  {evidenceItems.length === 0 ? (
                    <Text style={[styles.statusText, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                      No field notes attached.
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

                <View style={styles.buttonRow}>
                  <PrimaryButton
                    title="← Category"
                    variant="outline"
                    onPress={() => setWizardStep(1)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <PrimaryButton
                    title="Proceed to Review →"
                    onPress={handleStep2Next}
                    disabled={!description || description.trim().length < 5}
                    style={{ flex: 1, marginLeft: 8 }}
                  />
                </View>
              </View>
            )}

            {/* STEP 3: REVIEW & SUBMISSION */}
            {wizardStep === 3 && (
              <View style={styles.section}>
                <Text style={[styles.stepTitle, { color: theme.colors.textPrimary }]}>
                  Step 3: Final Review & Mesh Broadcast
                </Text>
                <Text style={[styles.stepHint, { color: theme.colors.textSecondary }]}>
                  Verify details before persisting locally and broadcasting to nearby mesh nodes.
                </Text>

                {/* Review Card */}
                <View style={[styles.reviewCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.reviewCategory, { color: theme.colors.textPrimary }]}>
                      {CATEGORIES.find((c) => c.value === category)?.label || category}
                    </Text>
                    <SeverityBadge severity={severity} />
                  </View>

                  <Text style={[styles.reviewLabel, { color: theme.colors.textSecondary }]}>Description:</Text>
                  <Text style={[styles.reviewValue, { color: theme.colors.textPrimary }]}>{description}</Text>

                  <Text style={[styles.reviewLabel, { color: theme.colors.textSecondary }]}>Location Status:</Text>
                  <Text style={[styles.reviewValue, { color: theme.colors.textPrimary }]}>
                    {attachLocation
                      ? locationState.location
                        ? `Lat: ${locationState.location.latitude.toFixed(4)}, Long: ${locationState.location.longitude.toFixed(4)}`
                        : 'Attached (Acquiring on submit)'
                      : 'Not attached'}
                  </Text>

                  <Text style={[styles.reviewLabel, { color: theme.colors.textSecondary }]}>Attached Evidence:</Text>
                  <Text style={[styles.reviewValue, { color: theme.colors.textPrimary }]}>
                    {evidenceItems.length > 0 ? `${evidenceItems.length} field note item(s)` : 'None'}
                  </Text>
                </View>

                {/* Operational Notice */}
                <View style={[styles.noticeCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
                  <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
                    🔒 <Text style={{ fontWeight: '700' }}>Local-First Guarantee:</Text> Submitting will save your report directly to local Android Room SQLite disk storage first. P2P radio broadcast on Port 18888 will follow automatically when mesh peers are available.
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <PrimaryButton
                    title="← Edit Details"
                    variant="outline"
                    onPress={() => setWizardStep(2)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <PrimaryButton
                    title={isSubmitting ? 'Submitting...' : 'BROADCAST EMERGENCY REPORT'}
                    variant={severity === 'CRITICAL' ? 'danger' : 'primary'}
                    onPress={submitReport}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    style={{ flex: 2, marginLeft: 8 }}
                  />
                </View>
              </View>
            )}
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
  progressCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6C757D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeCompleted: {
    backgroundColor: '#10B981',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  formContainer: {
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepHint: {
    fontSize: 13,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
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
  categoryCard: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  severityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 110,
    fontSize: 14,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  reviewCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewCategory: {
    fontSize: 18,
    fontWeight: '800',
  },
  reviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 2,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  noticeCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
  },
  banner: {
    padding: 18,
    borderRadius: 12,
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
    fontWeight: '800',
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
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#495057',
  },
  networkStatusBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF60',
    borderRadius: 8,
  },
  networkStatusText: {
    fontSize: 13,
    color: '#0D6EFD',
    fontWeight: '600',
  },
  networkErrorText: {
    fontSize: 13,
    color: '#FD7E14',
    fontWeight: '600',
  },
});
