import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { orchestrate } from '@/agents/orchestrator';
import { AGENT_LABELS } from '@/agents/subjects/index';

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
  if (!r.ok) {
    console.error('Firebase lookup error:', d);
    return null;
  }
  return d.users?.[0] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fu = await getFirebaseUser(token);
    if (!fu) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const uid = fu.localId;

    const { message, conversationId } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const [{ data: user }, { data: cache }] = await Promise.all([
      db.from('users').select('*').eq('id', uid).single(),
      db.from('classroom_cache').select('data').eq('user_id', uid).maybeSingle(),
    ]);

    let convId = conversationId;
    if (!convId) {
      const { data: conv } = await db
        .from('conversations')
        .insert({ user_id: uid, title: message.slice(0, 40) })
        .select().single();
      convId = conv?.id;
    }

    const { data: history } = await db
      .from('messages').select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true }).limit(20);

    const result = await orchestrate({
      message,
      grade: user?.grade ?? '',
      track: user?.track ?? '',
      subjects: user?.subjects ?? [],
      classroomData: cache?.data?.formatted ?? '',
      conversationHistory: (history ?? []).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const label = AGENT_LABELS[result.agentUsed] ?? '';
    const reply = label ? `*[${label}]*\n\n${result.reply}` : result.reply;

    await Promise.all([
      db.from('messages').insert([
        { conversation_id: convId, role: 'user', content: message },
        { conversation_id: convId, role: 'assistant', content: reply },
      ]),
      db.from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', convId),
    ]);

    return NextResponse.json({ reply, conversationId: convId, agentUsed: result.agentUsed, agentLabel: label });
  } catch (err) {
    console.error('/api/chat:', err);
    return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
  }
}
