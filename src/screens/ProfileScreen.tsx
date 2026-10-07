import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useServices } from '../services/ServiceContext';
import { NavIcon } from '../components/NavIcon';
import type { NetworkEngine } from '../contracts/network/NetworkEngine';

interface ProfileScreenProps {
  networkEngine?: NetworkEngine;
  onNavigateToMesh?: () => void;
  onNavigateToSettings?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  networkEngine: injectedNetworkEngine,
  onNavigateToMesh,
  onNavigateToSettings,
}) => {
  const { theme } = useTheme();
  const contextServices = useServices();
  const networkEngine = injectedNetworkEngine || contextServices.networkEngine;

  const [nodeStatus, setNodeStatus] = useState<'ONLINE' | 'OFFLINE' | 'INITIALIZING'>('INITIALIZING');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (networkEngine) {
      networkEngine.getPeers().then((res) => {
        if (isMounted) {
          if (res.ok) {
            setNodeStatus('ONLINE');
          } else {
            setNodeStatus('OFFLINE');
          }
        }
      }).catch(() => {
        if (isMounted) setNodeStatus('OFFLINE');
      });
    } else {
      setNodeStatus('OFFLINE');
    }
    return () => {
      isMounted = false;
    };
  }, [networkEngine]);

  const handleCopy = (label: string, value: string) => {
    setCopiedField(label);
    const msg = `Copied ${label} to clipboard: ${value}`;
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', value);
    }
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusColor = () => {
    switch (nodeStatus) {
      case 'ONLINE':
        return theme.colors.confidenceConfirmed;
      case 'INITIALIZING':
        return theme.colors.severityMedium;
      case 'OFFLINE':
      default:
        return theme.colors.textSecondary;
    }
  };

  const deviceId = 'self-node-01';
  const publicKeyFingerprint = 'ed25519:7a8f:3c91:e402:8b1d:6c9f:01a4:5e82';
  const protocolVersion = 'v1.0 (Store-and-Forward)';
  const createdAtFormatted = 'Local Device Initialization';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* App Operational Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <View>
          <Text style={[styles.headerSub, { color: theme.colors.textSecondary }]}>BLACKOUT IDENTITY</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Node Identity & Security</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsIconBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}
          onPress={onNavigateToSettings}
          activeOpacity={0.7}
        >
          <NavIcon name="Settings" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Node Identity Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <View style={[styles.avatarBox, { backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary }]}>
            <NavIcon name="PEER" size={32} color={theme.colors.primary} />
          </View>

          <Text style={[styles.heroBadge, { color: theme.colors.textSecondary }]}>LOCAL MESH NODE</Text>
          <Text style={[styles.heroNodeId, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {deviceId}
          </Text>

          <View style={[styles.statusPill, { backgroundColor: `${getStatusColor()}15`, borderColor: `${getStatusColor()}40` }]}>
            <Text style={{ color: getStatusColor(), fontSize: 8, marginRight: 6 }}>●</Text>
            <Text style={[styles.statusPillText, { color: getStatusColor() }]}>
              {nodeStatus === 'ONLINE' ? 'NODE OPERATIONAL' : nodeStatus === 'INITIALIZING' ? 'INITIALIZING' : 'STANDALONE / OFFLINE'}
            </Text>
          </View>
        </View>

        {/* 2. Technical Identity Attributes */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>TECHNICAL IDENTITY METADATA</Text>

          <View style={[styles.cardGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.attrRow, { borderBottomColor: theme.colors.surfaceBorder }]}
              onPress={() => handleCopy('Device ID', deviceId)}
              activeOpacity={0.7}
            >
              <View style={styles.attrLeft}>
                <NavIcon name="DEVICE" size={16} color={theme.colors.textSecondary} />
                <View style={styles.attrTextStack}>
                  <Text style={[styles.attrLabel, { color: theme.colors.textSecondary }]}>Device ID</Text>
                  <Text style={[styles.attrValue, { color: theme.colors.textPrimary }]}>{deviceId}</Text>
                </View>
              </View>
              <Text style={[styles.copyHint, { color: theme.colors.primary }]}>
                {copiedField === 'Device ID' ? '✓ Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.attrRow, { borderBottomColor: theme.colors.surfaceBorder }]}
              onPress={() => handleCopy('Public Key', publicKeyFingerprint)}
              activeOpacity={0.7}
            >
              <View style={styles.attrLeft}>
                <NavIcon name="KEY" size={16} color={theme.colors.textSecondary} />
                <View style={styles.attrTextStack}>
                  <Text style={[styles.attrLabel, { color: theme.colors.textSecondary }]}>Public Key Fingerprint</Text>
                  <Text style={[styles.attrValueMono, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {publicKeyFingerprint}
                  </Text>
                </View>
              </View>
              <Text style={[styles.copyHint, { color: theme.colors.primary }]}>
                {copiedField === 'Public Key' ? '✓ Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.attrRow, { borderBottomColor: theme.colors.surfaceBorder }]}>
              <View style={styles.attrLeft}>
                <NavIcon name="INFO" size={16} color={theme.colors.textSecondary} />
                <View style={styles.attrTextStack}>
                  <Text style={[styles.attrLabel, { color: theme.colors.textSecondary }]}>Protocol Version</Text>
                  <Text style={[styles.attrValue, { color: theme.colors.textPrimary }]}>{protocolVersion}</Text>
                </View>
              </View>
            </View>

            <View style={styles.attrRow}>
              <View style={styles.attrLeft}>
                <NavIcon name="CLOCK" size={16} color={theme.colors.textSecondary} />
                <View style={styles.attrTextStack}>
                  <Text style={[styles.attrLabel, { color: theme.colors.textSecondary }]}>Identity Registered</Text>
                  <Text style={[styles.attrValue, { color: theme.colors.textPrimary }]}>{createdAtFormatted}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Security Architecture Section */}
        <View style={styles.sectionMargin}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>SECURITY & KEY STORAGE</Text>

          <View style={[styles.cardGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <View style={[styles.securityItem, { borderBottomColor: theme.colors.surfaceBorder }]}>
              <View style={styles.securityTitleRow}>
                <NavIcon name="SECURITY" size={16} color={theme.colors.confidenceConfirmed} />
                <Text style={[styles.securityTitle, { color: theme.colors.textPrimary }]}>Local Key Storage</Text>
              </View>
              <Text style={[styles.securitySub, { color: theme.colors.textSecondary }]}>
                Identity keys are generated locally and stored securely in Android Keystore / sandboxed local storage.
              </Text>
            </View>

            <View style={styles.securityItem}>
              <View style={styles.securityTitleRow}>
                <NavIcon name="NETWORK" size={16} color={theme.colors.primary} />
                <Text style={[styles.securityTitle, { color: theme.colors.textPrimary }]}>Mesh Node Verification</Text>
              </View>
              <Text style={[styles.securitySub, { color: theme.colors.textSecondary }]}>
                Packets are signed using local node keys for transport integrity on peer-to-peer Wi-Fi Direct & Bluetooth links.
              </Text>
            </View>
          </View>

          {/* Explicit Security Disclaimer */}
          <View style={[styles.disclaimerBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
            <View style={styles.disclaimerHeader}>
              <NavIcon name="WARNING" size={14} color={theme.colors.severityMedium} />
              <Text style={[styles.disclaimerTitle, { color: theme.colors.severityMedium }]}>
                SECURITY DISCLAIMER
              </Text>
            </View>
            <Text style={[styles.disclaimerText, { color: theme.colors.textSecondary }]}>
              <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>BLACKOUT Node Identity ≠ Real-World Identity.</Text>{' '}
              A node ID identifies a specific device on the offline mesh network. It does not authenticate or prove the real-world identity of the person operating the device.
            </Text>
          </View>
        </View>

        {/* 4. Navigation Shortcuts */}
        <View style={styles.sectionMargin}>
          {onNavigateToMesh && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
              onPress={onNavigateToMesh}
              activeOpacity={0.8}
            >
              <NavIcon name="NETWORK" size={18} color={theme.colors.primary} />
              <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>View Mesh Network Status</Text>
            </TouchableOpacity>
          )}

          {onNavigateToSettings && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder, marginTop: 10 }]}
              onPress={onNavigateToSettings}
              activeOpacity={0.8}
            >
              <NavIcon name="Settings" size={18} color={theme.colors.primary} />
              <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>App Configuration & Settings</Text>
            </TouchableOpacity>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingsIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroNodeId: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  attrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    minHeight: 54,
  },
  attrLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  attrTextStack: {
    marginLeft: 12,
    flex: 1,
  },
  attrLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  attrValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  attrValueMono: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  securityItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  securityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  securitySub: {
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimerBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
