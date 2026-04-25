'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useState, useRef } from 'react';
import type { Message } from '@/types';

interface Props {
  message: Message;
  avatarUrl?: string;
  isNew?: boolean;
}

function parseAgentBadge(content: string): { badge: string | null; text: string } {
  const match = content.match(/^\*\[(.+?)\]\*\n\n([\s\S]*)/);
  if (match) return { badge: match[1], text: match[2] };
  return { badge: null, text: content };
}

function StreamingText({ text, isNew }: { text: string; isNew: boolean }) {
  const [displayed, setDisplayed] = useState(isNew ? '' : text);
  const [isDone, setIsDone] = useState(!isNew);
  const indexRef = useRef(isNew ? 0 : text.length);

  useEffect(() => {
    if (!isNew) {
      setDisplayed(text);
      setIsDone(true);
      return;
    }

    const speed = 12;
    const timer = setInterval(() => {
      if (indexRef.current < text.length) {
        indexRef.current += Math.ceil(text.length / 200);
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        setDisplayed(text);
        setIsDone(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, isNew]);

  return (
    <div className={`relative transition-opacity duration-200 ${isDone ? 'opacity-100' : 'opacity-95'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:text-[#1A1A1A] prose-strong:text-[#1A1A1A]"
      >
        {displayed}
      </ReactMarkdown>
      {!isDone && (
        <span
          className="inline-block w-0.5 h-4 bg-[#1A1A1A] ml-0.5 align-middle"
          style={{ animation: 'cursor-blink 0.7s ease-in-out infinite' }}
        />
      )}
    </div>
  );
}

export function MessageBubble({ message, avatarUrl, isNew = false }: Props) {
  if (!message) return null;

  const isBot = message.role === 'assistant';
  const time = message?.created_at
    ? new Date(message.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : '';

  const { badge, text } = parseAgentBadge(message.content ?? '');

  return (
    <div className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'} max-w-[82%] ${isBot ? '' : 'self-end'}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 ${
          isBot
            ? 'bg-[#1A1A1A] text-white'
            : 'bg-[#1A1A1A] text-white overflow-hidden'
        }`}
      >
        {isBot ? 'S' : avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
        ) : 'א'}
      </div>

      <div className="flex flex-col gap-1">
        {badge && (
          <span className="text-[10px] text-[#9B9B9B] px-1 font-medium tracking-wide uppercase">
            {badge}
          </span>
        )}

        <div
          className={`px-4 py-3 text-sm leading-relaxed ${
            isBot
              ? 'bg-white border border-[rgba(0,0,0,0.07)] rounded-[2px_16px_16px_16px] text-[#1A1A1A] shadow-sm'
              : 'bg-[#1A1A1A] text-white rounded-[16px_2px_16px_16px]'
          }`}
        >
          {isBot ? (
            <StreamingText text={text || message.content || ''} isNew={isNew} />
          ) : (
            <span>{message.content}</span>
          )}
        </div>

        {time && (
          <p className={`text-[10px] text-[#9B9B9B] px-1 ${isBot ? '' : 'text-left'}`}>
            {time}
          </p>
        )}
      </div>
    </div>
  );
      }
