import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NavIcon } from '../components/NavIcon';

interface SettingsScreenProps {
  onNavigateToProfile?: () => void;
  onNavigateToMesh?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToProfile,
  onNavigateToMesh,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <View>
          <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]}>SYSTEM CONFIGURATION</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Settings & Diagnostics</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Appearance Section */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>APPEARANCE & THEME</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <View style={styles.settingRow}>
              <View style={styles.rowLeft}>
                <NavIcon name="Settings" size={18} color={theme.colors.primary} />
                <View style={styles.rowTextStack}>
                  <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Display Interface Theme</Text>
                  <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>
                    Currently: {isDark ? 'Dark Mode (High Contrast)' : 'Light Mode (Daylight Visible)'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: theme.colors.primary }]}
                onPress={toggleTheme}
                activeOpacity={0.8}
              >
                <Text style={styles.toggleBtnText}>{isDark ? 'Switch Light' : 'Switch Dark'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. Network & Mesh Section */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>OFFLINE MESH NETWORK</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <View style={[styles.settingRow, { borderBottomColor: theme.colors.surfaceBorder }]}>
              <View style={styles.rowLeft}>
                <NavIcon name="NETWORK" size={18} color={theme.colors.textSecondary} />
                <View style={styles.rowTextStack}>
                  <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Transport Protocol</Text>
                  <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>TCP Direct Sockets / Wi-Fi Direct (Port 18888)</Text>
                </View>
              </View>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.colors.surfaceBorder }]}>
              <View style={styles.rowLeft}>
                <NavIcon name="QUEUE" size={18} color={theme.colors.textSecondary} />
                <View style={styles.rowTextStack}>
                  <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Routing Strategy</Text>
                  <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>Store-and-Forward Flooding (TTL 3 Default)</Text>
                </View>
              </View>
            </View>

            {onNavigateToMesh && (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={onNavigateToMesh}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionRowText, { color: theme.colors.primary }]}>Open Network Status Console →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Security & Privacy Section */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>PRIVACY & SECURITY</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <View style={[styles.settingRow, { borderBottomColor: theme.colors.surfaceBorder }]}>
              <View style={styles.rowLeft}>
                <NavIcon name="KEY" size={18} color={theme.colors.textSecondary} />
                <View style={styles.rowTextStack}>
                  <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Identity Architecture</Text>
                  <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>Device & Key-Based Node ID (No Cloud Account)</Text>
                </View>
              </View>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.colors.surfaceBorder }]}>
              <View style={styles.rowLeft}>
                <NavIcon name="SECURITY" size={18} color={theme.colors.textSecondary} />
                <View style={styles.rowTextStack}>
                  <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Key Storage</Text>
                  <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>Android Keystore / Sandboxed App Data</Text>
                </View>
              </View>
            </View>

            {onNavigateToProfile && (
              <TouchableOpacity
                style={styles.actionRow}
                onPress={onNavigateToProfile}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionRowText, { color: theme.colors.primary }]}>View Node Identity & Public Key →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 4. Engine Specifications */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>ENGINE MODULE ARCHITECTURE</Text>
          <View style={[styles.cardGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <View style={[styles.settingRow, { borderBottomColor: theme.colors.surfaceBorder }]}>
              <Text style={[styles.engineTag, { color: theme.colors.textSecondary }]}>MEMBER 1</Text>
              <View style={styles.engineTextStack}>
                <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Network Engine</Text>
                <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>Android Native P2P, Sockets & Mesh Transports</Text>
              </View>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.colors.surfaceBorder }]}>
              <Text style={[styles.engineTag, { color: theme.colors.textSecondary }]}>MEMBER 2</Text>
              <View style={styles.engineTextStack}>
                <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Data Engine</Text>
                <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>Room Database, Incident Deduplication & DAOs</Text>
              </View>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: theme.colors.surfaceBorder }]}>
              <Text style={[styles.engineTag, { color: theme.colors.textSecondary }]}>MEMBER 3</Text>
              <View style={styles.engineTextStack}>
                <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Geospatial Engine</Text>
                <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>GNSS Location, Offline MapLibre & A* Router</Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={[styles.engineTag, { color: theme.colors.textSecondary }]}>MEMBER 4</Text>
              <View style={styles.engineTextStack}>
                <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]}>Application & AI Engine</Text>
                <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>React Native Console & Rule-Based Emergency AI</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. System About Card */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>SYSTEM INFORMATION</Text>
          <View style={[styles.aboutCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <View style={styles.aboutHeader}>
              <Text style={[styles.aboutTitle, { color: theme.colors.textPrimary }]}>BLACKOUT</Text>
              <View style={[styles.verBadge, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.verText, { color: theme.colors.primary }]}>v1.0.0-EMERGENCY</Text>
              </View>
            </View>

            <Text style={[styles.aboutSub, { color: theme.colors.textSecondary }]}>
              Offline Emergency Command & Peer-to-Peer Communication Console. Built to maintain situational awareness during infrastructure failure and zero-connectivity environments.
            </Text>

            <View style={[styles.buildRow, { borderTopColor: theme.colors.surfaceBorder }]}>
              <Text style={[styles.buildLabel, { color: theme.colors.textSecondary }]}>Build Tag</Text>
              <Text style={[styles.buildVal, { color: theme.colors.textPrimary }]}>2026.10-FIELD-RELEASE</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  sectionMargin: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cardGroup: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rowTextStack: {
    marginLeft: 12,
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  actionRowText: {
    fontSize: 13,
    fontWeight: '700',
  },
  engineTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    width: 70,
  },
  engineTextStack: {
    flex: 1,
  },
  aboutCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  verText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  aboutSub: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  buildRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  buildLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  buildVal: {
    fontSize: 11,
    fontWeight: '700',
  },
});
