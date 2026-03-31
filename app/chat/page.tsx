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

  useEffect(() => {
    firebaseUser?.getIdToken().then(setToken);
  }, [firebaseUser]);

  const { messages, loading, error, sendMessage, newConversation } = useChat(
    user?.id ?? '', token
  );

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
    if (!authLoading && user && !user.onboarding_complete) router.push('/onboarding');
  }, [user, authLoading, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6FF]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={user} onQuick={sendMessage} onNew={newConversation} />
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F6FF]">
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 scrollbar-thin">
            {messages.length === 0 ? (
              <WelcomeScreen name={user.name?.split(' ')[0] ?? ''} grade={user.grade ?? ''} onQuick={sendMessage} />
            ) : (
              messages.map(m => <MessageBubble key={m.id} message={m} avatarUrl={user.avatar_url} />)
            )}
            {loading && <TypingIndicator />}
            {error && <p className="text-center text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">{error}</p>}
            <div ref={bottomRef} />
          </div>
          <InputBar onSend={sendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
