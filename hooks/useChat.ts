'use client';
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message, Conversation } from '@/types';

interface ChatState {
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  loading: boolean;
  sending: boolean;
  error: string | null;
  newMessageId: string | null;
}

export function useChat(userId: string | null, idToken: string | null) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    conversations: [],
    currentConversationId: null,
    loading: false,
    sending: false,
    error: null,
    newMessageId: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(20);
    if (data) setState(prev => ({ ...prev, conversations: data as Conversation[] }));
  }, [userId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setState(prev => ({ ...prev, loading: true, currentConversationId: conversationId }));
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setState(prev => ({
      ...prev,
      messages: ((data as Message[]) || []).filter(Boolean),
      loading: false,
    }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!idToken || !content.trim() || state.sending) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const now = new Date().toISOString();
    const tempId = 'temp-' + Date.now();

    const tempUserMsg: Message = {
      id: tempId,
      conversation_id: state.currentConversationId || '',
      role: 'user',
      content,
      created_at: now,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, tempUserMsg].filter(Boolean),
      sending: true,
      error: null,
      newMessageId: null,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: content,
          conversationId: state.currentConversationId,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      const replyText = result?.reply ?? '';
      const convId = result?.conversationId ?? state.currentConversationId ?? '';
      const replyTime = new Date().toISOString();

      const confirmedUserMsg: Message = {
        id: 'user-' + Date.now(),
        conversation_id: convId,
        role: 'user',
        content,
        created_at: now,
      };

      const botMsgId = 'bot-' + Date.now();
      const botMsg: Message = {
        id: botMsgId,
        conversation_id: convId,
        role: 'assistant',
        content: replyText,
        created_at: replyTime,
      };

      setState(prev => {
        const filtered = prev.messages.filter(m => m && m.id !== tempId);
        const newMsgs = [...filtered, confirmedUserMsg, botMsg].filter(Boolean);

        const convExists = prev.conversations.some(c => c.id === convId);
        const updatedConvs = convExists
          ? prev.conversations.map(c =>
              c.id === convId ? { ...c, last_message_at: replyTime } : c
            )
          : [
              {
                id: convId,
                user_id: userId!,
                title: content.slice(0, 40),
                last_message_at: replyTime,
                created_at: replyTime,
              },
              ...prev.conversations,
            ];

        return {
          ...prev,
          messages: newMsgs,
          currentConversationId: convId,
          conversations: updatedConvs,
          sending: false,
          newMessageId: botMsgId,
        };
      });

      // Clear new message highlight after animation completes
      setTimeout(() => {
        setState(prev => ({ ...prev, newMessageId: null }));
      }, 5000);

    } catch (err: unknown) {
      if ((err as { name: string }).name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m && m.id !== tempId),
        sending: false,
        error: 'שגיאה בשליחת ההודעה. נסה שוב.',
        newMessageId: null,
      }));
    }
  }, [idToken, state.sending, state.currentConversationId, userId]);

  const newConversation = useCallback(() => {
    setState(prev => ({ ...prev, messages: [], currentConversationId: null, error: null, newMessageId: null }));
  }, []);

  return { ...state, loadConversations, loadMessages, sendMessage, newConversation };
             }
