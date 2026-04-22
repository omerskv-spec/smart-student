export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { orchestrate } from '@/agents/orchestrator';
import { AGENT_LABELS } from '@/agents/subjects/index';

async function verifyToken(token: string): Promise<{ uid: string; email: string } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!res.ok) {
      console.error('Firebase token lookup failed:', res.status);
      return null;
    }
    const data = await res.json();
    const user = data.users?.[0];
    if (!user) return null;
    return { uid: user.localId, email: user.email || '' };
  } catch (err) {
    console.error('Token verification error:', err);
    return null;
  }
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabase();
    const { message, conversationId } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const { data: user } = await supabase.from('users').select('*').eq('id', decoded.uid).single();
    const { data: cache } = await supabase.from('classroom_cache').select('data').eq('user_id', decoded.uid).single();

    let convId = conversationId;
    if (!convId) {
      const { data: conv } = await supabase.from('conversations').insert({
        user_id: decoded.uid,
        title: message.slice(0, 40),
      }).select().single();
      convId = conv?.id;
    }

    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    const historyMapped = (history ?? []).map((m: {role: string; content: string}) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const result = await orchestrate({
      message,
      grade: user?.grade ?? '',
      track: user?.track ?? '',
      subjects: user?.subjects ?? [],
      classroomData: cache?.data?.formatted ?? '',
      conversationHistory: historyMapped,
    });

    const agentLabel = AGENT_LABELS[result.agentUsed] ?? '';
    const replyWithBadge = agentLabel
      ? '*[' + agentLabel + ']*\n\n' + result.reply
      : result.reply;

    await supabase.from('messages').insert([
      { conversation_id: convId, role: 'user', content: message },
      { conversation_id: convId, role: 'assistant', content: replyWithBadge },
    ]);

    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convId);

    return NextResponse.json({
      reply: replyWithBadge,
      conversationId: convId,
      agentUsed: result.agentUsed,
      agentLabel,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
