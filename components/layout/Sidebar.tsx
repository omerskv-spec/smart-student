'use client';
import { useState } from 'react';
import { SYSTEM_LINKS, REFERENCE_LINKS, SUBJECTS } from '@/lib/constants';
import { Toast } from '@/components/ui/Toast';
import type { User } from '@/types';

interface Props { user: User; onQuick: (msg: string) => void; onNew: () => void; }

const QUICK_ACTIONS = [
  { icon: '📋', label: 'מה יש לי השבוע?', msg: 'מה יש לי להגיש השבוע?' },
  { icon: '💡', label: 'לא הבנתי משהו', msg: 'לא הבנתי את החומר בשיעור' },
  { icon: '✏️', label: 'שיעורי בית', msg: 'תעזור לי עם שיעורי הבית שלי' },
  { icon: '🎯', label: 'הכנה למבחן', msg: 'מתי המבחן הבא ואיך אני מתכונן?' },
];

export function Sidebar({ user, onQuick, onNew }: Props) {
  const [toast, setToast] = useState('');

  const openLink = (url: string, label: string) => {
    window.open(url, '_blank');
    setToast(`פותח ${label}... חזור לשאול שאלות 💡`);
  };

  const userSubjects = SUBJECTS.filter(s => user.subjects?.includes(s.id));

  return (
    <aside className="w-64 bg-white border-l border-[var(--border)] flex flex-col overflow-y-auto scrollbar-thin flex-shrink-0">
      <div className="p-3">
        <button onClick={onNew} className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-all">
          <span className="text-base">+</span> שיחה חדשה
        </button>
      </div>

      <nav className="flex-1 px-2 pb-4">
        <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider px-2 py-2 mt-1">קיצורים</p>
        {QUICK_ACTIONS.map(a => (
          <button key={a.msg} onClick={() => onQuick(a.msg)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[var(--muted)] hover:bg-purple-50 hover:text-purple-700 transition-all text-right">
            <span>{a.icon}</span><span>{a.label}</span>
          </button>
        ))}

        <hr className="my-3 border-[var(--border)]" />

        <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider px-2 py-2">המערכות שלי</p>
        {SYSTEM_LINKS.map(l => (
          <button key={l.url} onClick={() => openLink(l.url, l.name)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--muted)] hover:bg-purple-50 hover:text-purple-700 transition-all text-right">
            <span>{l.emoji}</span><span>{l.name}</span>
          </button>
        ))}

        {userSubjects.length > 0 && (
          <>
            <hr className="my-3 border-[var(--border)]" />
            <p className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider px-2 py-2">חומר עזר</p>
            {userSubjects.map(s => (
              <button key={s.id} onClick={() => openLink(REFERENCE_LINKS[s.id], s.name)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--muted)] hover:bg-purple-50 hover:text-purple-700 transition-all text-right">
                <span>{s.emoji}</span><span>{s.name}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </aside>
  );
}
