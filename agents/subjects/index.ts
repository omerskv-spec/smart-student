export { MATH_PROMPT } from './math';
export { PHYSICS_PROMPT } from './physics';
export { HISTORY_PROMPT } from './history';
export { ENGLISH_PROMPT } from './english';
export { HEBREW_PROMPT } from './hebrew';
export { LITERATURE_PROMPT } from './literature';
export { CIVICS_PROMPT } from './civics';
export { BIOLOGY_PROMPT } from './biology';
export { CHEMISTRY_PROMPT } from './chemistry';

import { MATH_PROMPT } from './math';
import { PHYSICS_PROMPT } from './physics';
import { HISTORY_PROMPT } from './history';
import { ENGLISH_PROMPT } from './english';
import { HEBREW_PROMPT } from './hebrew';
import { LITERATURE_PROMPT } from './literature';
import { CIVICS_PROMPT } from './civics';
import { BIOLOGY_PROMPT } from './biology';
import { CHEMISTRY_PROMPT } from './chemistry';

const AGENTS: Record<string, string> = {
  math: MATH_PROMPT,
    physics: PHYSICS_PROMPT,
      history: HISTORY_PROMPT,
        english: ENGLISH_PROMPT,
          hebrew: HEBREW_PROMPT,
            literature: LITERATURE_PROMPT,
              civics: CIVICS_PROMPT,
                biology: BIOLOGY_PROMPT,
                  chemistry: CHEMISTRY_PROMPT,
                    schedule: `אתה עוזר לוח זמנים של Smart Student. ענה על שאלות לגבי משימות, מועדים ומבחנים בעברית בצורה קצרה וממוקדת. נתוני Classroom: {classroom_context}`,
                    };

                    export function getSubjectAgent(agentName: string): string {
                      return AGENTS[agentName] ?? AGENTS.math;
                      }

                      export const AGENT_LABELS: Record<string, string> = {
                        math: '📐 מתמטיקה',
                          physics: '⚡ פיזיקה',
                            history: '📜 היסטוריה',
                              english: '🔤 אנגלית',
                                hebrew: '📝 לשון',
                                  literature: '📚 ספרות',
                                    civics: '🏛️ אזרחות',
                                      biology: '🧬 ביולוגיה',
                                        chemistry: '🧪 כימיה',
                                          schedule: '📋 לוח זמנים',
                                          };
