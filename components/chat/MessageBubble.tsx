import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/types';

interface Props { message: Message; avatarUrl?: string; }

export function MessageBubble({ message, avatarUrl }: Props) {
  const isBot = message.role === 'assistant';
  const time = new Date(message.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'} max-w-[80%] ${isBot ? '' : 'self-end'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1 ${isBot ? 'bg-purple-100 text-purple-700' : 'bg-purple-600 text-white overflow-hidden'}`}>
        {isBot ? '★' : avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : 'א'}
      </div>
      <div>
        <div className={`px-4 py-3 text-sm leading-relaxed ${isBot ? 'bg-white border border-[var(--border)] rounded-[4px_18px_18px_18px] text-[var(--text)]' : 'bg-purple-600 text-white rounded-[18px_4px_18px_18px]'}`}>
          {isBot ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5">
              {message.content}
            </ReactMarkdown>
          ) : message.content}
        </div>
        <p className={`text-[10px] text-[var(--muted)] mt-1 ${isBot ? 'text-right' : 'text-left'}`}>{time}</p>
      </div>
    </div>
  );
}
