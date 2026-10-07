import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { PeerDto } from '../contracts/network/PeerDto';
import { NavIcon } from '../components/NavIcon';

interface PeerDetailScreenProps {
  peerId: string;
  peer?: PeerDto;
  onBack: () => void;
  onStartChat: (peerId: string) => void;
}

export const PeerDetailScreen: React.FC<PeerDetailScreenProps> = ({
  peerId,
  peer,
  onBack,
  onStartChat,
}) => {
  const { theme } = useTheme();

  const formattedLastSeen = peer?.last_seen_at
    ? new Date(peer.last_seen_at).toLocaleTimeString()
    : 'Unknown';

  const getConnectionColor = () => {
    switch (peer?.connection_state) {
      case 'CONNECTED':
        return theme.colors.confidenceConfirmed;
      case 'HANDSHAKING':
      case 'CONNECTING':
        return theme.colors.severityMedium;
      case 'DISCOVERED':
        return theme.colors.severityLow;
      case 'LOST':
      default:
        return theme.colors.severityCritical;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Peer Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Identity Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <View style={styles.nodeHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary }]}>
              <NavIcon name="PEER" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.nodeInfo}>
              <Text style={[styles.nodeTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {peerId}
              </Text>
              <View style={styles.statusRow}>
                <Text style={{ color: getConnectionColor(), fontSize: 10, marginRight: 4 }}>●</Text>
                <Text style={[styles.statusText, { color: getConnectionColor() }]}>
                  {peer?.connection_state || 'DISCOVERED'}
                </Text>
              </View>
            </View>
          </View>

          {/* DTO Attribute Matrix */}
          <View style={styles.attrGrid}>
            <View style={[styles.attrItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
              <Text style={[styles.attrLabel, { color: theme.colors.textSecondary }]}>Peer ID</Text>
              <Text style={[styles.attrValue, { color: theme.colors.textPrimary }]}>{peerId}</Text>
            </View>

            <View style={[styles.attrItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
              <Text style={[styles.attrLabel, { color: theme.colors.textSecondary }]}>Transport Type</Text>
              <Text style={[styles.attrValue, { color: theme.colors.textPrimary }]}>
                {peer?.transport || 'WIFI_DIRECT / TCP'}
              </Text>
            </View>

            <View style={[styles.attrItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
              <Text style={[styles.attrLabel, { color: theme.colors.textSecondary }]}>Connection State</Text>
              <Text style={[styles.attrValue, { color: theme.colors.textPrimary }]}>
                {peer?.connection_state || 'DISCOVERED'}
              </Text>
            </View>

            <View style={[styles.attrItem, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
              <Text style={[styles.attrLabel, { color: theme.colors.textSecondary }]}>Last Seen</Text>
              <Text style={[styles.attrValue, { color: theme.colors.textPrimary }]}>{formattedLastSeen}</Text>
            </View>
          </View>

          {/* Capabilities Section */}
          <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>NODE CAPABILITIES</Text>
          <View style={styles.capabilitiesRow}>
            {(peer?.capabilities && peer.capabilities.length > 0
              ? peer.capabilities
              : ['STORE_AND_FORWARD', 'DIRECT_CHAT', 'EMERGENCY_RELAY']
            ).map((cap, idx) => (
              <View key={idx} style={[styles.capTag, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
                <NavIcon name="RELAY" size={12} color={theme.colors.primary} />
                <Text style={[styles.capTagText, { color: theme.colors.primary }]}>{cap}</Text>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => onStartChat(peerId)}
            activeOpacity={0.8}
          >
            <NavIcon name="MESSAGE" size={18} color="#FFFFFF" />
            <Text style={styles.chatButtonText}>Start Direct Message</Text>
          </TouchableOpacity>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  nodeInfo: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attrGrid: {
    gap: 10,
    marginBottom: 20,
  },
  attrItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  attrLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  attrValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  capabilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  capTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  capTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
