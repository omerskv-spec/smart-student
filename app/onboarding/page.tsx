'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GRADES, TRACKS, SUBJECTS } from '@/lib/constants';

export default function OnboardingPage() {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const [grade, setGrade] = useState('');
  const [track, setTrack] = useState('כללי');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.onboarding_complete) router.push('/chat');
  }, [user, router]);

  const toggleSubject = (id: string) => {
    setSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!grade || subjects.length === 0 || !firebaseUser) return;
    setSaving(true);
    setError('');
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ grade, track, subjects, onboarding_complete: true }),
      });
      if (!res.ok) throw new Error('שגיאה בשמירה');
      router.push('/chat');
    } catch {
      setError('שגיאה בשמירת הפרופיל. נסה שוב.');
      setSaving(false);
    }
  };

  const canSubmit = grade && subjects.length > 0;

  return (
    <div className="min-h-screen bg-[#F7F6FF] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg border border-[var(--border)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-purple-900">בוא נכיר 👋</h1>
          <p className="text-[var(--muted)] mt-1 text-sm">כדי שאוכל לעזור לך הכי טוב</p>
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-[var(--text)] block mb-3">כיתה *</label>
          <div className="flex gap-2 flex-wrap">
            {GRADES.map(g => (
              <button key={g} onClick={() => setGrade(g)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${grade === g ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-[var(--muted)] border-[var(--border)] hover:border-purple-300'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-[var(--text)] block mb-3">מגמה</label>
          <div className="flex gap-2 flex-wrap">
            {TRACKS.map(t => (
              <button key={t} onClick={() => setTrack(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${track === t ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-[var(--muted)] border-[var(--border)] hover:border-purple-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="text-sm font-medium text-[var(--text)] block mb-3">מקצועות (בחר לפחות אחד) *</label>
          <div className="grid grid-cols-2 gap-2">
            {SUBJECTS.map(s => (
              <button key={s.id} onClick={() => toggleSubject(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all text-right ${subjects.includes(s.id) ? 'bg-purple-100 border-purple-400 text-purple-900 font-medium' : 'bg-white text-[var(--text)] border-[var(--border)] hover:border-purple-300'}`}>
                <span>{s.emoji}</span><span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

        <button onClick={handleSubmit} disabled={!canSubmit || saving}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2">
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'בואו נתחיל! 🚀'}
        </button>
      </div>
    </div>
  );
}
