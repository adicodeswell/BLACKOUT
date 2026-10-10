import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { usePeers } from '../hooks/usePeers';
import { NavIcon } from '../components/NavIcon';
import type { PeopleService } from '../services/PeopleService';
import type { PeerDto } from '../contracts/network/PeerDto';

interface PeersScreenProps {
  peopleService: PeopleService;
  onSelectPeer: (peerId: string, peer?: PeerDto) => void;
  onStartChat: (peerId: string) => void;
}

export const PeersScreen: React.FC<PeersScreenProps> = ({
  peopleService,
  onSelectPeer,
  onStartChat,
}) => {
  const { theme } = useTheme();
  const { peers, isLoading, error, refresh } = usePeers(peopleService);

  const renderPeerItem = ({ item }: { item: PeerDto }) => {
    const isConnected = item.connection_state === 'CONNECTED';
    return (
      <View style={[styles.peerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
        <View style={styles.peerHeader}>
          <View style={[styles.peerAvatar, { backgroundColor: theme.colors.primary }]}>
            <NavIcon name="PEER" color="#FFFFFF" size={18} />
          </View>
          <View style={styles.peerDetails}>
            <Text style={[styles.peerTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.peer_id}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.tag, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>{item.transport}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: isConnected ? `${theme.colors.confidenceConfirmed}20` : `${theme.colors.severityMedium}20`, borderColor: isConnected ? theme.colors.confidenceConfirmed : theme.colors.severityMedium }]}>
                <Text style={[styles.statusBadgeText, { color: isConnected ? theme.colors.confidenceConfirmed : theme.colors.severityMedium }]}>
                  {item.connection_state}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          {!isConnected && (
            <TouchableOpacity
              style={[styles.fillButton, { backgroundColor: theme.colors.severityMedium }]}
              onPress={() => peopleService.connectToPeer(item.peer_id)}
              activeOpacity={0.8}
            >
              <Text style={styles.fillButtonText}>Connect</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.outlineButton, { borderColor: theme.colors.surfaceBorder }]}
            onPress={() => onSelectPeer(item.peer_id, item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.outlineButtonText, { color: theme.colors.textPrimary }]}>Inspect Node</Text>
          </TouchableOpacity>

          {isConnected && (
            <TouchableOpacity
              style={[styles.fillButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => onStartChat(item.peer_id)}
              activeOpacity={0.8}
            >
              <NavIcon name="MESSAGE" color="#FFFFFF" size={14} />
              <Text style={styles.fillButtonText}>Message</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>DISCOVERED MESH NODES</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refresh} activeOpacity={0.7}>
          <NavIcon name="REFRESH" color={theme.colors.primary} size={14} />
          <Text style={[styles.refreshText, { color: theme.colors.primary }]}>Re-scan</Text>
        </TouchableOpacity>
      </View>

      {isLoading && peers.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Scanning local P2P radios (Port 18888)...</Text>
        </View>
      ) : peers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.colors.surfaceElevated }]}>
              <NavIcon name="NETWORK" color={theme.colors.textMuted} size={28} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>NO NEARBY NODES DETECTED</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              No compatible BLACKOUT peers are currently visible. Peer discovery bridge is pending Member 1 integration, or no P2P radio nodes are within physical signal range.
            </Text>

            {error && (
              <View style={[styles.errorBanner, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerBorder }]}>
                <Text style={[styles.errorText, { color: theme.colors.dangerText }]}>{error.message}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
              onPress={refresh}
              activeOpacity={0.8}
            >
              <Text style={styles.scanButtonText}>Re-scan Mesh Network</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={peers}
          keyExtractor={(item) => item.peer_id}
          renderItem={renderPeerItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={theme.colors.primary} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 44,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 300,
  },
  errorBanner: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  scanButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  peerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  peerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  peerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  peerDetails: {
    flex: 1,
  },
  peerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fillButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  fillButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

