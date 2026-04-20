export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { createClient } from '@supabase/supabase-js';
import { orchestrate } from '@/agents/orchestrator';
import { AGENT_LABELS } from '@/agents/subjects/index';

if (!getApps().length) {
    initializeApp({ credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })});
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
    try {
          const token = req.headers.get('Authorization')?.replace('Bearer ', '');
          if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const decoded = await getAuth().verifyIdToken(token);
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

      const agentLabel = AGENT_LABELS[result.agentUsed] ?? '';
          const replyWithBadge = agentLabel
            ? `*[${agentLabel}]*\n\n${result.reply}`
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
          return NextResponse.json({ error: 'שגיאה בשרת' }, { status: 500 });
    }
}
