import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { PeersScreen } from './PeersScreen';
import type { PeopleService } from '../services/PeopleService';
import type { PeerDto } from '../contracts/network/PeerDto';

type SegmentTab = 'Conversations' | 'Peers' | 'Contacts';

interface PeopleScreenProps {
  peopleService: PeopleService;
  onSelectPeer: (peerId: string, peer?: PeerDto) => void;
  onStartChat: (peerId: string) => void;
}

export const PeopleScreen: React.FC<PeopleScreenProps> = ({
  peopleService,
  onSelectPeer,
  onStartChat,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<SegmentTab>('Conversations');
  const [refreshing, setRefreshing] = useState(false);

  const conversations = peopleService.getConversationsList();

  const handleRefresh = async () => {
    setRefreshing(true);
    await peopleService.getPeers();
    setRefreshing(false);
  };

  const emergencyContacts = [
    { id: 'RESCUE_DISPATCH_01', name: 'Rescue Dispatch Node', role: 'Emergency Command', status: 'ACTIVE' },
    { id: 'MEDICAL_TRIAGE_99', name: 'Medical Triage Channel', role: 'First Aid Coordinator', status: 'ACTIVE' },
    { id: 'SHELTER_RELIEF_NODE', name: 'Shelter & Relief Admin', role: 'Resource Logistics', status: 'ACTIVE' },
  ];

  const renderConversationItem = ({ item }: { item: { peerId: string; lastMessage: any } }) => {
    const textStr =
      typeof item.lastMessage.payload === 'string'
        ? item.lastMessage.payload
        : item.lastMessage.payload?.text || 'Direct Message';
    const timeStr = new Date(item.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity
        style={[styles.threadCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
        onPress={() => onStartChat(item.peerId)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>{item.peerId.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={[styles.peerTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.peerId}
            </Text>
            <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>{timeStr}</Text>
          </View>
          <Text style={[styles.previewText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {textStr}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContactItem = ({ item }: { item: typeof emergencyContacts[0] }) => {
    return (
      <View style={[styles.threadCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
        <View style={[styles.avatarCircle, { backgroundColor: theme.colors.severityCritical }]}>
          <Text style={styles.avatarText}>🚨</Text>
        </View>

        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={[styles.peerTitle, { color: theme.colors.textPrimary }]}>{item.name}</Text>
            <View style={[styles.activeTag, { backgroundColor: theme.colors.confidenceConfirmed }]}>
              <Text style={styles.activeTagText}>{item.status}</Text>
            </View>
          </View>
          <Text style={[styles.previewText, { color: theme.colors.textSecondary }]}>
            {item.role} • Node: {item.id}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.contactChatButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onStartChat(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.contactChatButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Network identity pill header */}
      <View style={[styles.identityBanner, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <View style={styles.identityRow}>
          <Text style={[styles.identityTitle, { color: theme.colors.textPrimary }]}>Local Node: self-node-01</Text>
          <View style={styles.badgeRow}>
            <Text style={{ color: theme.colors.confidenceConfirmed, fontSize: 8, marginRight: 4 }}>●</Text>
            <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>Port 18888 Mesh</Text>
          </View>
        </View>
      </View>

      {/* Segment Selector Tabs */}
      <View style={[styles.segmentContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'Conversations' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setActiveTab('Conversations')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: activeTab === 'Conversations' ? '#FFFFFF' : theme.colors.textSecondary }]}>
            Conversations ({conversations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'Peers' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setActiveTab('Peers')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: activeTab === 'Peers' ? '#FFFFFF' : theme.colors.textSecondary }]}>
            Nearby Peers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'Contacts' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setActiveTab('Contacts')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, { color: activeTab === 'Contacts' ? '#FFFFFF' : theme.colors.textSecondary }]}>
            Emergency Channels
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'Peers' ? (
        <PeersScreen peopleService={peopleService} onSelectPeer={onSelectPeer} onStartChat={onStartChat} />
      ) : activeTab === 'Contacts' ? (
        <FlatList
          data={emergencyContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContactItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.peerId}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📬</Text>
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No Active Message Threads</Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                  Select a discovered P2P node from "Nearby Peers" or tap an "Emergency Channel" to initiate direct communication.
                </Text>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setActiveTab('Peers')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>View Discovered Peers</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  identityBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identityTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    margin: 12,
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  peerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
  },
  previewText: {
    fontSize: 12,
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  contactChatButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  contactChatButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
