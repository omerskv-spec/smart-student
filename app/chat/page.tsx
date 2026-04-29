'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { WelcomeScreen } from '@/components/chat/WelcomeScreen';
import { InputBar } from '@/components/chat/InputBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ChatPage() {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState('');

  // Refresh token on mount and every 45 minutes to prevent 401 errors
  useEffect(() => {
    if (!firebaseUser) return;
    const refresh = async () => {
      const t = await firebaseUser.getIdToken(true);
      setToken(t);
    };
    refresh();
    const interval = setInterval(refresh, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [firebaseUser]);

  const {
    messages,
    loading,
    error,
    newMessageId,
    currentConversationId,
    sendMessage,
    newConversation,
  } = useChat(user?.id ?? '', token, firebaseUser);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
    if (!authLoading && user && !user.onboarding_complete) router.push('/onboarding');
  }, [user, authLoading, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F4EF]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={user} onQuick={sendMessage} onNew={newConversation} />
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F5F4EF]">
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scrollbar-thin">
            {messages.filter(Boolean).length === 0 ? (
              <WelcomeScreen
                name={user.name?.split(' ')[0] ?? ''}
                grade={user.grade ?? ''}
                onQuick={sendMessage}
              />
            ) : (
              messages.filter(Boolean).map(m => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  avatarUrl={user.avatar_url ?? undefined}
                  isNew={m.id === newMessageId}
                />
              ))
            )}
            {loading && <TypingIndicator />}
            {error && (
              <p className="text-center text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>
          <InputBar
            onSend={sendMessage}
            disabled={loading}
            token={token}
            conversationId={currentConversationId ?? null}
          />
        </div>
      </div>
    </div>
  );
}
