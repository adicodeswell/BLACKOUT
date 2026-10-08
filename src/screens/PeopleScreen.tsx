import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal
} from 'react-native';
import { NavIcon } from '../components/NavIcon';
import RNFS from 'react-native-fs';
import { useTheme } from '../theme/ThemeContext';
import type { PeopleService } from '../services/PeopleService';
import type { PeerDto } from '../contracts/network/PeerDto';

interface PeopleScreenProps {
  peopleService: PeopleService;
  onSelectPeer: (peerId: string) => void;
  onStartChat: (peerId: string) => void;
}

export const PeopleScreen: React.FC<PeopleScreenProps> = ({
  peopleService,
  onSelectPeer,
  onStartChat,
}) => {
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'Chats' | 'Nearby'>('Chats');
  const [conversations, setConversations] = useState<any[]>([]);
  const [nearbyPeers, setNearbyPeers] = useState<PeerDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile State
  const [userName, setUserName] = useState('Mesh Node ' + Math.floor(1000 + Math.random() * 9000));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState('');

  const PROFILE_PATH = RNFS.DocumentDirectoryPath + '/my_profile.json';

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const exists = await RNFS.exists(PROFILE_PATH);
        if (exists) {
          const data = await RNFS.readFile(PROFILE_PATH, 'utf8');
          const parsed = JSON.parse(data);
          if (parsed.userName) setUserName(parsed.userName);
        }
      } catch (e) {
        console.warn('Failed to load profile');
      }
    };
    loadProfile();
  }, []);

  const saveProfile = async () => {
    if (tempName.trim()) {
      const newName = tempName.trim();
      setUserName(newName);
      try {
        await RNFS.writeFile(PROFILE_PATH, JSON.stringify({ userName: newName }), 'utf8');
      } catch (e) {
        console.warn('Failed to save profile');
      }
    }
    setIsEditingProfile(false);
  };

  const loadData = useCallback(async () => {
    setConversations(peopleService.getConversationsList());
    const peerRes = await peopleService.getPeers();
    if (peerRes.ok) {
      setNearbyPeers(peerRes.data);
    }
  }, [peopleService]);

  useEffect(() => {
    loadData();
    const unsub = peopleService.subscribePeers((peers) => {
      setNearbyPeers(peers);
    });
    return () => unsub();
  }, [loadData, peopleService]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getFilteredChats = () => {
    if (!searchQuery) return conversations;
    return conversations.filter(c => c.peerId.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const getFilteredPeers = () => {
    if (!searchQuery) return nearbyPeers;
    return nearbyPeers.filter(p => p.peer_id?.toLowerCase().includes(searchQuery.toLowerCase()) || (p as any).name?.toLowerCase().includes(searchQuery.toLowerCase()));
  };



  const renderChatItem = ({ item }: { item: any }) => {
    const preview = item.lastMessage.payload?.text || 'Sent an attachment';
    return (
      <TouchableOpacity
        style={[styles.chatCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
        onPress={() => onStartChat(item.peerId)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>{item.peerId.substring(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.peerTitle, { color: theme.colors.textPrimary }]}>{item.peerId}</Text>
            <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
              {new Date(item.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={[styles.previewText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {preview}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPeerItem = ({ item }: { item: PeerDto }) => {
    const isOnline = item.connection_state === 'CONNECTED' || item.connection_state === 'DISCOVERED';
    return (
      <TouchableOpacity
        style={[styles.peerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
        onPress={() => onStartChat(item.peer_id)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarCircle, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{item.peer_id.substring(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.peerContent}>
          <Text style={[styles.peerTitle, { color: theme.colors.textPrimary }]}>{(item as any).name || item.peer_id}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? theme.colors.networkActive : theme.colors.textMuted }]} />
            <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
              {isOnline ? 'Nearby' : 'Out of range'}
            </Text>
          </View>
        </View>
        <View style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.actionBtnText}>Message</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* Friendly Profile Header */}
      <TouchableOpacity 
        style={[styles.profileHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}
        onPress={() => { setTempName(userName); setIsEditingProfile(true); }}
        activeOpacity={0.7}
      >
        <View style={[styles.myAvatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.myAvatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.myProfileInfo}>
          <Text style={[styles.myName, { color: theme.colors.textPrimary }]}>{userName}</Text>
          <Text style={[styles.myStatus, { color: theme.colors.networkActive }]}>Online & Discoverable</Text>
        </View>
        <NavIcon name="SETTINGS" color={theme.colors.textMuted} size={20} />
      </TouchableOpacity>

      {/* Global Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <NavIcon name="SEARCH" color={theme.colors.textMuted} size={18} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search friends and nearby people..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Simplified Tabs */}
      <View style={[styles.segmentContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'Chats' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setActiveTab('Chats')}
        >
          <Text style={[styles.segmentText, { color: activeTab === 'Chats' ? '#FFFFFF' : theme.colors.textSecondary }]}>
            Chats ({conversations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, activeTab === 'Nearby' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setActiveTab('Nearby')}
        >
          <Text style={[styles.segmentText, { color: activeTab === 'Nearby' ? '#FFFFFF' : theme.colors.textSecondary }]}>
            Nearby ({nearbyPeers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List Content */}
      <FlatList
        data={activeTab === 'Chats' ? getFilteredChats() : getFilteredPeers()}
        keyExtractor={(item: any) => item.peerId || item.peer_id}
        renderItem={activeTab === 'Chats' ? renderChatItem : renderPeerItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.colors.surfaceElevated }]}>
              <NavIcon name="MESSAGE" color={theme.colors.textMuted} size={28} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No {activeTab}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              {searchQuery ? "No one matches your search." : (activeTab === 'Chats' ? "Tap 'Nearby' to find people around you and start a conversation." : "No one is broadcasting nearby right now.")}
            </Text>
          </View>
        }
      />

      

      {/* Profile Edit Modal */}
      <Modal visible={isEditingProfile} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Edit Profile</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>This is how you will appear to others on the mesh network.</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, borderColor: theme.colors.surfaceBorder }]}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Your Name"
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setIsEditingProfile(false)}>
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, { backgroundColor: theme.colors.primary }]} onPress={saveProfile}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  myAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  myAvatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  myProfileInfo: { flex: 1 },
  myName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  myStatus: { fontSize: 12, fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentText: { fontSize: 13, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 100, gap: 12 },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  peerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  chatContent: { flex: 1 },
  peerContent: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  peerTitle: { fontSize: 16, fontWeight: '700' },
  timeText: { fontSize: 12 },
  previewText: { fontSize: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12 },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', padding: 24, borderRadius: 16, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, marginBottom: 20 },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  modalCancelText: { fontSize: 15, fontWeight: '600' },
  modalSave: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  modalSaveText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});
