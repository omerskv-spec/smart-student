import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase';
import { SUBJECT_NAMES } from '@/lib/constants';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function verifyToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

function buildSystemPrompt(grade: string, track: string, subjects: string[], classroomSummary: string): string {
  const subjectNames = subjects.map(s => SUBJECT_NAMES[s] || s).join(', ');
  
  const classroomData = classroomSummary && classroomSummary !== 'אין משימות פעילות כרגע.'
    ? `\n\nנתוני Google Classroom של התלמיד:\n${classroomSummary}`
    : '\n\nאין נתוני Google Classroom זמינים כרגע.';

  return `אתה Smart Student — עוזר לימודי חכם לתלמידי ישראל.

פרטי התלמיד: כיתה ${grade}, מגמה ${track}, מקצועות: ${subjectNames}.${classroomData}

תכנית הלימודים מבוססת על משרד החינוך הישראלי:
- כיתה ז-ח: מתמטיקה — שברים, משוואות פשוטות. אנגלית — Present/Past Simple.
- כיתה ט-י: מתמטיקה — פונקציות, אלגברה. פיזיקה — מכניקה, חשמל.
- כיתה יא-יב: נגזרות, אינטגרלים, הכנה לבגרות.

כללים:
- עונה תמיד בעברית
- שפה ידידותית לגיל 12-18
- כשמסביר — תן דוגמה קונקרטית
- מקסימום 4 משפטים אלא אם ביקשו הסבר מפורט
- כשתלמיד תקוע — שאל "איפה בדיוק נתקעת?" לפני שמסביר
- לעולם אל תמציא מידע על משימות — רק מה שמופיע ב-Classroom data
- אל תתחיל ב-"בהחלט!" או "שאלה מצוינת!" — ישר לעניין
- אם שואלים על מה יש להגיש ואין Classroom data — אמור זאת בכנות`.trim();
}

export async function POST(request: NextRequest) {
  const uid = await verifyToken(request);
  if (!uid) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });

  const body = await request.json();
  const { message, conversationId } = body as { message: string; conversationId?: string };

  if (!message?.trim()) {
    return NextResponse.json({ error: 'הודעה ריקה' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch user profile
  const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', uid).single();
  if (userError || !user) return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });

  // Fetch classroom cache
  const { data: classroomCache } = await supabase.from('classroom_cache').select('data').eq('user_id', uid).single();
  const classroomSummary = (classroomCache?.data as { summary?: string } | null)?.summary || '';

  // Get or create conversation
  let convId = conversationId;
  let convTitle = 'שיחה חדשה';

  if (!convId) {
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({ user_id: uid, title: 'שיחה חדשה' })
      .select()
      .single();
    if (convError || !newConv) return NextResponse.json({ error: 'שגיאה ביצירת שיחה' }, { status: 500 });
    convId = newConv.id;
    convTitle = newConv.title;
  } else {
    const { data: conv } = await supabase.from('conversations').select('title').eq('id', convId).single();
    convTitle = conv?.title || 'שיחה חדשה';
  }

  // Fetch last 20 messages
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(20);

  const messagesForClaude = [
    ...(history || []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: message },
  ];

  // Call Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: buildSystemPrompt(user.grade || '', user.track || '', user.subjects || [], classroomSummary),
    messages: messagesForClaude,
  });

  const assistantContent = response.content[0].type === 'text' ? response.content[0].text : '';

  // Save messages
  const now = new Date().toISOString();
  const [{ data: userMsg }, { data: assistantMsg }] = await Promise.all([
    supabase.from('messages').insert({ conversation_id: convId, role: 'user', content: message, created_at: now }).select().single(),
    supabase.from('messages').insert({ conversation_id: convId, role: 'assistant', content: assistantContent, created_at: new Date(Date.now() + 1).toISOString() }).select().single(),
  ]);

  // Update conversation
  const newTitle = convTitle === 'שיחה חדשה' ? message.slice(0, 50) : convTitle;
  await supabase.from('conversations').update({ last_message_at: now, title: newTitle }).eq('id', convId);

  return NextResponse.json({
    conversationId: convId,
    conversationTitle: newTitle,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
  });
}
