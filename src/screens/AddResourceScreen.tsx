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
import { NavIcon, NavIconName } from '../components/NavIcon';
import type { ResourceService } from '../services/ResourceService';
import type { ResourceType, ResourceAvailability } from '../contracts/data/ResourceDto';
import type { LocationDto } from '../contracts/geo/LocationDto';

interface AddResourceScreenProps {
  resourceService: ResourceService;
  onBack: () => void;
  onSuccess: () => void;
}

const RESOURCE_TYPES: Array<{ label: string; value: ResourceType; icon: NavIconName }> = [
  { label: 'Water', value: 'WATER', icon: 'WATER' },
  { label: 'Food', value: 'FOOD', icon: 'FOOD' },
  { label: 'Shelter', value: 'SHELTER', icon: 'SHELTER' },
  { label: 'Medical', value: 'MEDICAL', icon: 'MEDICAL' },
  { label: 'Medicine', value: 'MEDICINE', icon: 'MEDICAL' },
  { label: 'Other', value: 'OTHER', icon: 'OTHER' },
];

const AVAILABILITY_OPTIONS: Array<{ label: string; value: ResourceAvailability }> = [
  { label: 'AVAILABLE', value: 'AVAILABLE' },
  { label: 'LIMITED STOCK', value: 'LIMITED' },
  { label: 'AT CAPACITY', value: 'FULL' },
  { label: 'CLOSED', value: 'CLOSED' },
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

    // Standard location for newly logged resources (acquired via GeoEngine in full environment)
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]}>EMERGENCY LOGISTICS</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Add Aid Resource</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerBorder }]}>
            <NavIcon name="WARNING" size={16} color={theme.colors.severityCritical} />
            <Text style={[styles.errorBannerText, { color: theme.colors.dangerText }]}>{errorMessage}</Text>
          </View>
        )}

        {/* 01. Resource Category */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>01 RESOURCE CATEGORY *</Text>
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
                  <NavIcon name={item.icon} size={14} color={isSelected ? '#FFFFFF' : theme.colors.primary} />
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary, fontWeight: isSelected ? '700' : '600' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 02. Station Identity */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>02 STATION NAME *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder, color: theme.colors.textPrimary },
            ]}
            placeholder="e.g. Community Water Point #4"
            placeholderTextColor={theme.colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 03. Initial Availability */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>03 INITIAL AVAILABILITY STATUS *</Text>
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
                      { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary, fontWeight: isSelected ? '700' : '600' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 04. Capacity & Units */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>04 CAPACITY & UNITS (OPTIONAL)</Text>
          <View style={styles.rowSection}>
            <View style={styles.halfInputContainer}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Total Capacity</Text>
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
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Remaining Stock</Text>
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
        </View>

        {/* 05. Description & Access Notes */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>05 DESCRIPTION & ACCESS NOTES</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder, color: theme.colors.textPrimary },
            ]}
            placeholder="Operating hours, specific access instructions, rationing policies..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Primary Action Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.colors.primary, opacity: isSubmitting ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>ADD EMERGENCY RESOURCE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  backButtonText: { fontSize: 13, fontWeight: '700' },
  headerTitleGroup: { flex: 1 },
  headerSub: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  sectionHeading: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 },
  rowSection: { flexDirection: 'row', gap: 12 },
  halfInputContainer: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, minHeight: 44 },
  chipText: { fontSize: 12 },
  input: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, minHeight: 48 },
  textArea: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, minHeight: 90, fontSize: 14 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 14 },
  errorBannerText: { fontSize: 13, fontWeight: '600' },
  submitButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
});
