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
}

export function useChat(userId: string | null, idToken: string | null) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    conversations: [],
    currentConversationId: null,
    loading: false,
    sending: false,
    error: null,
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
    setState(prev => ({ ...prev, messages: (data as Message[]) || [], loading: false }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!idToken || !content.trim() || state.sending) return;
    
    // Prevent double submission
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: state.currentConversationId || '',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, tempUserMsg],
      sending: true,
      error: null,
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
      
      setState(prev => {
        const msgs = prev.messages.filter(m => m.id !== tempUserMsg.id);
        return {
          ...prev,
          messages: [...msgs, result.userMessage, result.assistantMessage],
          currentConversationId: result.conversationId,
          conversations: prev.conversations.some(c => c.id === result.conversationId)
            ? prev.conversations.map(c => 
                c.id === result.conversationId 
                  ? { ...c, last_message_at: result.assistantMessage.created_at, title: result.conversationTitle || c.title }
                  : c
              )
            : [{ id: result.conversationId, user_id: userId!, title: result.conversationTitle || 'שיחה חדשה', last_message_at: result.assistantMessage.created_at, created_at: result.assistantMessage.created_at }, ...prev.conversations],
          sending: false,
        };
      });
    } catch (err: unknown) {
      if ((err as { name: string }).name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== tempUserMsg.id),
        sending: false,
        error: 'שגיאה בשליחת ההודעה. נסה שוב.',
      }));
    }
  }, [idToken, state.sending, state.currentConversationId, userId]);

  const newConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      currentConversationId: null,
      error: null,
    }));
  }, []);

  return { ...state, loadConversations, loadMessages, sendMessage, newConversation };
}
