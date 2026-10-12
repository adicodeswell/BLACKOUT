import { useState, useEffect, useCallback } from "react";
import type { PeopleService } from "../services/PeopleService";
import type { MessageDto } from "../contracts/network/MessageDto";

export interface UseDirectMessageResult {
  messages: MessageDto[];
  isLoading: boolean;
  isSending: boolean;
  sendError?: string;
  sendMessage: (text: string) => Promise<boolean>;
  refresh: () => void;
}

export function useDirectMessage(
  peopleService: PeopleService,
  peerId: string
): UseDirectMessageResult {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | undefined>(undefined);

  const loadConversation = useCallback(() => {
    setIsLoading(true);
    let history = peopleService.getConversation(peerId);
    if (history.length === 0) {
      const peers = (peopleService as any).activePeers || [];
      const match = peers.find((p: any) => p.peer_id === peerId || p.transport_address === peerId);
      if (match) {
        const altId = match.peer_id === peerId ? match.transport_address : match.peer_id;
        if (altId) {
          history = peopleService.getConversation(altId);
        }
      }
    }
    setMessages([...history]);
    setIsLoading(false);
  }, [peopleService, peerId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    const unsubscribe = peopleService.subscribeMessages(undefined, () => {
      loadConversation();
    });
    return () => unsubscribe();
  }, [peopleService, loadConversation]);

  const sendMessage = async (text: string): Promise<boolean> => {
    setIsSending(true);
    setSendError(undefined);
    const res = await peopleService.sendDirectMessage(peerId, text);
    setIsSending(false);

    if (res.ok) {
      loadConversation();
      return true;
    } else {
      setSendError(res.error.message);
      return false;
    }
  };

  return {
    messages,
    isLoading,
    isSending,
    sendError,
    sendMessage,
    refresh: loadConversation,
  };
}
