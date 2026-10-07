import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ResourceService } from '../services/ResourceService';
import type { ResourceType, ResourceAvailability } from '../contracts/data/ResourceDto';
import type { LocationDto } from '../contracts/geo/LocationDto';

interface AddResourceScreenProps {
  resourceService: ResourceService;
  onBack: () => void;
  onSuccess: () => void;
}

const RESOURCE_TYPES: Array<{ label: string; value: ResourceType }> = [
  { label: '💧 Water', value: 'WATER' },
  { label: '🍲 Food', value: 'FOOD' },
  { label: '⛺ Shelter', value: 'SHELTER' },
  { label: '🚑 Medical Center', value: 'MEDICAL' },
  { label: '💊 Medicine', value: 'MEDICINE' },
  { label: '📦 Other Supply', value: 'OTHER' },
];

const AVAILABILITY_OPTIONS: Array<{ label: string; value: ResourceAvailability }> = [
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Limited Stock', value: 'LIMITED' },
  { label: 'Full / At Capacity', value: 'FULL' },
  { label: 'Closed', value: 'CLOSED' },
];

export const AddResourceScreen: React.FC<AddResourceScreenProps> = ({
  resourceService,
  onBack,
  onSuccess,
}) => {
  const { theme } = useTheme();

  const [type, setType] = useState<ResourceType>('WATER');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [availability, setAvailability] = useState<ResourceAvailability>('AVAILABLE');
  const [capacity, setCapacity] = useState<string>('');
  const [remainingCapacity, setRemainingCapacity] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMessage('Resource name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);

    // Standard default location for newly logged resources (in production acquired via GeoEngine)
    const location: LocationDto = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy_m: 10,
      captured_at: Date.now(),
    };

    const capNum = capacity ? parseInt(capacity, 10) : undefined;
    const remNum = remainingCapacity ? parseInt(remainingCapacity, 10) : undefined;

    const res = await resourceService.createResource({
      type,
      name: name.trim(),
      description: description.trim() || undefined,
      location,
      availability,
      capacity: isNaN(capNum!) ? undefined : capNum,
      remaining_capacity: isNaN(remNum!) ? undefined : remNum,
    });

    setIsSubmitting(false);

    if (res.ok) {
      onSuccess();
    } else {
      setErrorMessage(res.error.message || 'Failed to create resource.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.textPrimary }]}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: theme.colors.textPrimary }]}>Add Emergency Resource</Text>
        </View>

        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerBorder }]}>
            <Text style={[styles.errorBannerText, { color: theme.colors.dangerText }]}>⚠️ {errorMessage}</Text>
          </View>
        )}

        {/* Form Container */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          {/* 1. Resource Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>1. Resource Type *</Text>
            <View style={styles.chipGrid}>
              {RESOURCE_TYPES.map((item) => {
                const isSelected = type === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setType(item.value)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. Resource Name */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>2. Resource / Station Name *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder, color: theme.colors.textPrimary },
              ]}
              placeholder="e.g. Community Water Station #4"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* 3. Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>3. Description & Access Notes</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder, color: theme.colors.textPrimary },
              ]}
              placeholder="Operating hours, supplies provided, entry instructions..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          {/* 4. Availability Status */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>4. Initial Availability</Text>
            <View style={styles.chipGrid}>
              {AVAILABILITY_OPTIONS.map((item) => {
                const isSelected = availability === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                      },
                    ]}
                    onPress={() => setAvailability(item.value)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 5. Capacity Inputs (Optional) */}
          <View style={styles.rowSection}>
            <View style={styles.halfInputContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Total Capacity</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder, color: theme.colors.textPrimary },
                ]}
                placeholder="e.g. 500"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={capacity}
                onChangeText={setCapacity}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Remaining Units</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder, color: theme.colors.textPrimary },
                ]}
                placeholder="e.g. 350"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={remainingCapacity}
                onChangeText={setRemainingCapacity}
              />
            </View>
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary, opacity: isSubmitting ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Resource to Local Directory</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginRight: 12 },
  backButtonText: { fontSize: 13, fontWeight: '600' },
  screenTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1 },
  section: { marginBottom: 18 },
  rowSection: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  halfInputContainer: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12 },
  input: { borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 14 },
  textArea: { borderRadius: 8, borderWidth: 1, padding: 12, minHeight: 80, fontSize: 14 },
  errorBanner: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 14 },
  errorBannerText: { fontSize: 13, fontWeight: '600' },
  submitButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
