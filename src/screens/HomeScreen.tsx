import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { NetworkEngine } from '../contracts/network/NetworkEngine';
import type { PeerDto } from '../contracts/network/PeerDto';

interface HomeScreenProps {
  onReportEmergency?: () => void;
  networkEngine?: NetworkEngine;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onReportEmergency, networkEngine }) => {
  const { theme } = useTheme();

  const [networkStatus, setNetworkStatus] = useState<'INITIALIZING' | 'ACTIVE' | 'STOPPED' | 'UNAVAILABLE'>('INITIALIZING');
  const [peers, setPeers] = useState<PeerDto[]>([]);
  const [peerError, setPeerError] = useState<string | null>(null);

  useEffect(() => {
    if (!networkEngine) {
      setNetworkStatus('UNAVAILABLE');
      return;
    }

    let isMounted = true;

    const initNetwork = async () => {
      try {
        const startRes = await networkEngine.start();
        if (startRes.ok) {
          if (isMounted) setNetworkStatus('ACTIVE');
        } else {
          if (isMounted) setNetworkStatus('STOPPED');
        }

        const peersRes = await networkEngine.getPeers();
        if (peersRes.ok) {
          if (isMounted) setPeers(peersRes.data);
        } else {
          if (isMounted) setPeerError(peersRes.error.message);
        }
      } catch (_err) {
        if (isMounted) setNetworkStatus('UNAVAILABLE');
      }
    };

    initNetwork();

    // Subscribe to network events
    const unsubscribe = networkEngine.subscribe((event) => {
      if (event.type === 'PEER_CONNECTED' || event.type === 'PEER_DISCONNECTED') {
        networkEngine.getPeers().then((res) => {
          if (res.ok && isMounted) {
            setPeers(res.data);
          }
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [networkEngine]);

  const getStatusBadgeColor = () => {
    switch (networkStatus) {
      case 'ACTIVE':
        return theme.colors.confidenceConfirmed;
      case 'INITIALIZING':
        return theme.colors.severityMedium;
      case 'STOPPED':
        return theme.colors.severityCritical;
      case 'UNAVAILABLE':
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>BLACKOUT Home</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Emergency Mesh Network Command Center
        </Text>

        {/* Network Status Card */}
        <View style={[styles.statusBanner, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
          <View style={styles.statusHeaderRow}>
            <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>Mesh Network Status</Text>
            <View style={styles.statusBadgeRow}>
              <Text style={{ color: getStatusBadgeColor(), fontSize: 10, marginRight: 4 }}>●</Text>
              <Text style={[styles.statusBadgeText, { color: theme.colors.textPrimary }]}>
                {networkStatus === 'ACTIVE' ? 'Active (Port 18888)' : networkStatus}
              </Text>
            </View>
          </View>

          <View style={styles.peerRow}>
            <Text style={[styles.peerText, { color: theme.colors.textPrimary }]}>
              Connected Peers: <Text style={{ fontWeight: '800' }}>{peers.length}</Text>
            </Text>
            {peers.length === 0 && (
              <Text style={[styles.peerHint, { color: theme.colors.textSecondary }]}>
                (No active P2P connections)
              </Text>
            )}
          </View>
        </View>

        {onReportEmergency && (
          <TouchableOpacity
            style={[styles.emergencyButton, { backgroundColor: theme.colors.primaryDanger }]}
            onPress={onReportEmergency}
            activeOpacity={0.8}
          >
            <Text style={styles.emergencyButtonText}>🚨 Report Emergency</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  statusBanner: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  peerRow: {
    marginTop: 4,
  },
  peerText: {
    fontSize: 13,
  },
  peerHint: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  emergencyButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
