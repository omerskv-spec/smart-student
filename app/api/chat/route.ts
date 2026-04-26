import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, getAuthToken, unauthorized, serverError } from '@/lib/api';
import { getDb } from '@/lib/supabase';
import { orchestrate } from '@/agents/orchestrator';
import { AGENT_LABELS } from '@/agents/subjects/index';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const token = getAuthToken(req);
    if (!token) return unauthorized();

  const fu = await verifyFirebaseToken(token);
    if (!fu) return unauthorized();

  const uid = fu.localId;

  try {
        const { message, conversationId } = await req.json();
        if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

      const [{ data: user }, { data: cache }, { data: studentFiles }] = await Promise.all([
              getDb().from('users').select('*').eq('id', uid).single(),
              getDb().from('classroom_cache').select('data').eq('user_id', uid).maybeSingle(),
              getDb()
                .from('student_files')
                .select('filename, content, file_type, created_at')
                .eq('user_id', uid)
                .order('created_at', { ascending: false })
                .limit(5),
            ]);

      const studentMaterials =
              studentFiles && studentFiles.length > 0
            ? studentFiles
                    .map((f) => {
                                    if (f.file_type.startsWith('image/')) {
                                                      return `[תמונה: ${f.filename}]`;
                                    }
                                    return `[קובץ: ${f.filename}]\n${(f.content ?? '').slice(0, 4000)}`;
                    })
                    .join('\n\n---\n\n')
                : '';

      let convId = conversationId;
        if (!convId) {
                const { data: conv } = await getDb()
                  .from('conversations')
                  .insert({ user_id: uid, title: message.slice(0, 40) })
                  .select()
                  .single();
                convId = conv?.id;
        }

      const { data: history } = await getDb()
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
              conversationHistory: (history ?? []).map((m) => ({
                        role: m.role as 'user' | 'assistant',
                        content: m.content,
              })),
              studentMaterials,
      });

      const label = AGENT_LABELS[result.agentUsed] ?? '';
        const reply = label ? `*[${label}]*\n\n${result.reply}` : result.reply;

      await Promise.all([
              getDb().from('messages').insert([
                { conversation_id: convId, role: 'user', content: message },
                { conversation_id: convId, role: 'assistant', content: reply },
                      ]),
              getDb()
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', convId),
            ]);

      return NextResponse.json({
              reply,
              conversationId: convId,
              agentUsed: result.agentUsed,
              agentLabel: label,
      });
  } catch (err) {
        console.error('/api/chat:', err);
        return serverError('שגיאה בשרת');
  }
}
