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
    const history = peopleService.getConversation(peerId);
    setMessages([...history]);
    setIsLoading(false);
  }, [peopleService, peerId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    const unsubscribe = peopleService.subscribeMessages(peerId, () => {
      loadConversation();
    });
    return () => unsubscribe();
  }, [peopleService, peerId, loadConversation]);

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
