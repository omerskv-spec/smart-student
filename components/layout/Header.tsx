'use client';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';

export function Header({ user }: { user: User }) {
  return (
    <header className="h-14 bg-white border-b border-[var(--border)] flex items-center justify-between px-5 sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white text-base">★</div>
        <span className="font-bold text-purple-900 text-base">Smart Student</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full border-2 border-purple-100 object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700">
              {user.name?.[0] ?? 'א'}
            </div>
          )}
          <span className="text-sm font-medium text-[var(--text)] hidden sm:block">{user.name?.split(' ')[0]}</span>
        </div>
        <button onClick={() => signOut(auth)} className="text-xs text-[var(--muted)] hover:text-[var(--text)] px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all">
          יציאה
        </button>
      </div>
    </header>
  );
}
