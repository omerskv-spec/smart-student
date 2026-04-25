import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Hardcoded to bypass stale Vercel env vars
const db = createClient(
  'https://tvckyeplbdemdpnzxhni.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y2t5ZXBsYmRlbWRwbnp4aG5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk1NTk3MCwiZXhwIjoyMDkwNTMxOTcwfQ.9taeVXMWyiqa_koKoI_qXzhNO4ittHJG9dPOxh1pMas'
);

// Firebase web API key - hardcoded to bypass stale env var
const FIREBASE_API_KEY = 'AIzaSyBywuW-9AiH0EHu16A_FMD1TIXONdxzpXY';

async function getFirebaseUser(token: string) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) }
  );
  const d = await r.json();
  return r.ok ? d.users?.[0] ?? null : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ formatted: '' });

    const fu = await getFirebaseUser(token);
    if (!fu) return NextResponse.json({ formatted: '' });

    const uid = fu.localId;

    const { data: cache } = await db
      .from('classroom_cache').select('*').eq('user_id', uid).maybeSingle();

    const stale = !cache || new Date(cache.updated_at) < new Date(Date.now() - 6 * 3600 * 1000);
    if (!stale) return NextResponse.json({ formatted: cache.data?.formatted ?? '' });

    const gToken = req.headers.get('X-Google-Token');
    if (!gToken) return NextResponse.json({ formatted: '' });

    const cr = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
      headers: { Authorization: `Bearer ${gToken}` },
    });
    if (!cr.ok) return NextResponse.json({ formatted: '' });

    const courses = ((await cr.json()).courses ?? []).slice(0, 6);
    let formatted = `קורסים: ${courses.map((c: { name: string }) => c.name).join(', ')}\n\n`;

    for (const course of courses) {
      try {
        const wr = await fetch(
          `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?pageSize=5`,
          { headers: { Authorization: `Bearer ${gToken}` } }
        );
        if (!wr.ok) continue;
        const works = (await wr.json()).courseWork ?? [];
        if (works.length) {
          formatted += `${course.name}:\n`;
          works.forEach((w: { title: string; dueDate?: { day: number; month: number } }) => {
            formatted += ` - ${w.title}${w.dueDate ? ` (${w.dueDate.day}/${w.dueDate.month})` : ''}\n`;
          });
        }
      } catch { continue; }
    }

    await db.from('classroom_cache').upsert({
      user_id: uid,
      data: { formatted },
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ formatted });
  } catch (err) {
    console.error('/api/classroom:', err);
    return NextResponse.json({ formatted: '' });
  }
}
