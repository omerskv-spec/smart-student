import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { orchestrate } from '@/agents/orchestrator';
import { AGENT_LABELS } from '@/agents/subjects/index';

export const dynamic = 'force-dynamic';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getFirebaseUser(token: string) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) }
  );
  const d = await r.json();
  return r.ok ? d.users?.[0] ?? null : null;
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
