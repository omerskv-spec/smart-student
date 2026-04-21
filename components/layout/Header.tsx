'use client';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';

export function Header({ user }: { user: User }) {
  return (
    <header className="h-12 bg-[#F5F4EF] border-b border-[rgba(0,0,0,0.08)] flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-[#1A1A1A] flex items-center justify-center text-white text-xs">✦</div>
        <span className="font-semibold text-sm text-[#1A1A1A]">Smart Student</span>
      </div>
      <div className="flex items-center gap-2">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-xs font-medium">
            {user.name?.[0] ?? 'א'}
          </div>
        )}
        <span className="text-sm text-[#6B6B6B] hidden sm:block">{user.name?.split(' ')[0]}</span>
        <button
          onClick={() => signOut(auth)}
          className="text-xs text-[#9B9B9B] hover:text-[#1A1A1A] px-2 py-1 rounded-lg hover:bg-[rgba(0,0,0,0.06)] transition-all"
        >
          יציאה
        </button>
      </div>
    </header>
  );
}
