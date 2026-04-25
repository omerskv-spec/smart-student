import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/types';

interface Props {
  message: Message;
  avatarUrl?: string;
}

function parseAgentBadge(content: string): { badge: string | null; text: string } {
  const match = content.match(/^\*\[(.+?)\]\*\n\n([\s\S]*)/);
  if (match) return { badge: match[1], text: match[2] };
  return { badge: null, text: content };
}

export function MessageBubble({ message, avatarUrl }: Props) {
  if (!message) return null;

  const isBot = message.role === 'assistant';
  const time = message?.created_at
    ? new Date(message.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : '';
  const { badge, text } = parseAgentBadge(message.content ?? '');

  return (
    <div className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'} max-w-[80%] ${isBot ? '' : 'self-end'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1 ${isBot ? 'bg-[#1A1A1A] text-[#1A1A1A]' : 'bg-[#1A1A1A] text-white'}`}>
        {isBot ? '*' : avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : 'x'}
      </div>
      <div>
        <div className={`px-4 py-3 text-sm leading-relaxed ${isBot ? 'bg-white border border-[rgba(0,0,0,0.06)] rounded-[4px_18px_18px_18px] text-[#1A1A1A]' : 'bg-[#1A1A1A] text-white rounded-[18px_18px_4px_18px]'}`}>
          {isBot ? (
            <>
              {badge && (
                <div style={{ display: 'inline-block', background: '#F5F4EF', color: '#6B6B6B', fontSize: '11px', fontWeight: 500, padding: '2px 10px', borderRadius: '20px', marginBottom: '6px' }}>
                  {badge}
                </div>
              )}
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
                {text}
              </ReactMarkdown>
            </>
          ) : message.content}
        </div>
        {time && <p className={`text-[10px] text-[#9B9B9B] mt-1 ${isBot ? 'text-right' : 'text-left'}`}>{time}</p>}
      </div>
    </div>
  );
}
