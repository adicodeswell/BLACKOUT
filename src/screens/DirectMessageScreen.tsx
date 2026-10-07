import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useDirectMessage } from '../hooks/useDirectMessage';
import type { PeopleService } from '../services/PeopleService';
import type { MessageDto } from '../contracts/network/MessageDto';
import { NavIcon } from '../components/NavIcon';

interface DirectMessageScreenProps {
  peerId: string;
  peopleService: PeopleService;
  onBack: () => void;
}

export const DirectMessageScreen: React.FC<DirectMessageScreenProps> = ({
  peerId,
  peopleService,
  onBack,
}) => {
  const { theme } = useTheme();
  const { messages, isLoading, isSending, sendError, sendMessage } = useDirectMessage(
    peopleService,
    peerId
  );
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    const success = await sendMessage(text);
    if (success) {
      setInputText('');
    }
  };

  const getMessageContent = (msg: MessageDto): string => {
    if (typeof msg.payload === 'string') return msg.payload;
    if (typeof msg.payload === 'object' && msg.payload !== null && 'text' in msg.payload) {
      return String((msg.payload as any).text);
    }
    return JSON.stringify(msg.payload);
  };

  const renderMessageItem = ({ item }: { item: MessageDto }) => {
    const isOutgoing = item.origin_device_id === 'self-node-01' || item.destination_device_id === peerId;
    const content = getMessageContent(item);
    const timeStr = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.bubbleContainer, isOutgoing ? styles.outgoingContainer : styles.incomingContainer]}>
        <View
          style={[
            styles.messageBubble,
            isOutgoing
              ? { backgroundColor: theme.colors.primary, borderBottomRightRadius: 2 }
              : { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder, borderWidth: 1, borderBottomLeftRadius: 2 },
          ]}
        >
          {!isOutgoing && (
            <Text style={[styles.senderLabel, { color: theme.colors.textSecondary }]}>{peerId}</Text>
          )}
          <Text style={[styles.messageText, { color: isOutgoing ? '#FFFFFF' : theme.colors.textPrimary }]}>
            {content}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.timeText, { color: isOutgoing ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }]}>
              {timeStr}
            </Text>
            {isOutgoing && (
              <Text style={[styles.statusTag, { color: 'rgba(255,255,255,0.9)' }]}> ✓ Mesh Sent</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {peerId}
          </Text>
          <View style={styles.headerSubRow}>
            <Text style={{ color: theme.colors.confidenceConfirmed, fontSize: 8, marginRight: 4 }}>●</Text>
            <Text style={[styles.headerSubText, { color: theme.colors.textSecondary }]}>Direct P2P Session</Text>
          </View>
        </View>

        <View style={{ width: 60 }} />
      </View>

      {sendError && (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.background, borderColor: theme.colors.severityCritical }]}>
          <Text style={[styles.errorText, { color: theme.colors.severityCritical }]}>Send Failure: {sendError}</Text>
        </View>
      )}

      {/* Message List */}
      {isLoading && messages.length === 0 ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <View style={{ marginBottom: 12 }}>
              <NavIcon name="MESSAGE" size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>Direct P2P Channel Open</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              No messages exchanged with <Text style={{ fontWeight: '700' }}>{peerId}</Text> yet. Send a direct mesh packet below.
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.message_id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Input Composer */}
      <View style={[styles.composerContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.surfaceBorder }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.surfaceBorder,
            },
          ]}
          placeholder={`Message ${peerId}...`}
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim().length > 0 && !isSending ? theme.colors.primary : theme.colors.surfaceBorder },
          ]}
          onPress={handleSend}
          disabled={inputText.trim().length === 0 || isSending}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <NavIcon name="SEND" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubText: {
    fontSize: 11,
  },
  errorBanner: {
    padding: 8,
    borderBottomWidth: 1,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  bubbleContainer: {
    width: '100%',
    marginVertical: 2,
  },
  outgoingContainer: {
    alignItems: 'flex-end',
  },
  incomingContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 14,
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '600',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
