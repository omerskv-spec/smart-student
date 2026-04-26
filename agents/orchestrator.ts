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
    studentMaterials?: string;
}

export interface OrchestratorOutput {
    reply: string;
    agentUsed: string;
    routingReason: string;
}

export async function orchestrate(input: OrchestratorInput): Promise<OrchestratorOutput> {
    let agentName = detectSubjectFallback(input.message);
    let routingReason = 'fallback detection';

  try {
        const routingResponse = await client.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 200,
                system: buildManagerPrompt(input),
                messages: [{ role: 'user', content: input.message }],
        });

      const text =
              routingResponse.content[0].type === 'text'
            ? routingResponse.content[0].text.trim()
                : '{}';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
                const routing = JSON.parse(jsonMatch[0]);
                if (routing.agent) {
                          agentName = routing.agent;
                          routingReason = routing.reason ?? '';
                }
        }
  } catch (err) {
        console.error('Manager routing failed, using fallback:', err);
  }

  const agentPrompt = buildAgentPrompt(agentName, input);

  const subjectResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: agentPrompt,
        messages: [
                ...input.conversationHistory.slice(-12),
          { role: 'user', content: input.message },
              ],
  });

  const reply =
        subjectResponse.content[0].type === 'text'
        ? subjectResponse.content[0].text
          : 'מצטער, הייתה שגיאה. נסה שוב.';

  return { reply, agentUsed: agentName, routingReason };
}

function buildManagerPrompt(input: OrchestratorInput): string {
    return MANAGER_PROMPT
      .replace('{grade}', input.grade)
      .replace('{track}', input.track)
      .replace('{subjects}', input.subjects.join(', ') || 'כל המקצועות')
      .replace('{classroom_data}', input.classroomData || 'אין נתונים');
}

function buildAgentPrompt(agentName: string, input: OrchestratorInput): string {
    return getSubjectAgent(agentName)
      .replace('{grade}', input.grade || 'לא צוין')
      .replace('{track}', input.track || 'כללי')
      .replace('{classroom_context}', input.classroomData || 'אין נתונים מ-Classroom')
      .replace('{teacher_content}', input.studentMaterials || 'התלמיד לא העלה חומרים עדיין');
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
