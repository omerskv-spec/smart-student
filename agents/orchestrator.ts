import Anthropic from '@anthropic-ai/sdk';
import { getSubjectAgent } from './subjects/index';
import { MANAGER_PROMPT } from './manager';

const client = new Anthropic();

export interface OrchestratorInput {
  message: string;
  grade: string;
  track: string;
  subjects: string[];
  classroomData: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface OrchestratorOutput {
  reply: string;
  agentUsed: string;
  routingReason: string;
}

export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const managerPrompt = MANAGER_PROMPT
    .replace('{grade}', input.grade)
    .replace('{track}', input.track)
    .replace('{subjects}', input.subjects.join(', '))
    .replace('{classroom_data}', input.classroomData || 'אין נתונים');

  const routingResponse = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    system: managerPrompt,
    messages: [{ role: 'user', content: input.message }],
  });

  let routing = { agent: 'math', reason: '', context: '' };
  try {
    const text = routingResponse.content[0].type === 'text' ? routingResponse.content[0].text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    routing = JSON.parse(jsonMatch ? jsonMatch[0] : text.trim());
  } catch {
    routing.agent = detectSubjectFallback(input.message);
  }

  const agentPrompt = getSubjectAgent(routing.agent)
    .replace('{grade}', input.grade)
    .replace('{track}', input.track)
    .replace('{classroom_context}', routing.context || '');

  const messages = [
    ...input.conversationHistory.slice(-10),
    { role: 'user' as const, content: input.message },
  ];

  const subjectResponse = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: agentPrompt,
    messages,
  });

  const reply = subjectResponse.content[0].type === 'text'
    ? subjectResponse.content[0].text
    : 'מצטער, הייתה שגיאה. נסה שוב.';

  return { reply, agentUsed: routing.agent, routingReason: routing.reason };
}

function detectSubjectFallback(message: string): string {
  const msg = message.toLowerCase();
  if (msg.match(/מספר|משוואה|חשבון|גאומטריה|פונקציה|נגזרת|אינטגרל/)) return 'math';
  if (msg.match(/כוח|מהירות|חשמל|גל|אנרגיה|תנועה/)) return 'physics';
  if (msg.match(/מלחמה|היסטוריה|תקופה|מנהיג|מהפכה/)) return 'history';
  if (msg.match(/english|grammar|tense|verb|writing/i)) return 'english';
  if (msg.match(/פועל|שם עצם|דקדוק|ניקוד|תחביר/)) return 'hebrew';
  if (msg.match(/שיר|סיפור|סופר|ספרות|יצירה/)) return 'literature';
  if (msg.match(/דמוקרטיה|מדינה|חוק|זכויות|ממשל/)) return 'civics';
  if (msg.match(/תא|גנטיקה|אבולוציה|ביולוגיה|חיידק/)) return 'biology';
  if (msg.match(/אטום|יסוד|תגובה|כימיה|מולקולה/)) return 'chemistry';
  return 'math';
}
