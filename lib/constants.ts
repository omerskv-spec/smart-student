export const GRADES = ['ז', 'ח', 'ט', 'י', 'יא', 'יב'] as const;
export type Grade = typeof GRADES[number];

export const TRACKS = ['כללי', 'מדעי', 'הומניסטי', 'טכנולוגי'] as const;
export type Track = typeof TRACKS[number];

export const SUBJECTS = [
  { id: 'math', name: 'מתמטיקה', emoji: '📐' },
  { id: 'english', name: 'אנגלית', emoji: '🔤' },
  { id: 'hebrew', name: 'עברית', emoji: '📝' },
  { id: 'history', name: 'היסטוריה', emoji: '📜' },
  { id: 'physics', name: 'פיזיקה', emoji: '⚡' },
  { id: 'chemistry', name: 'כימיה', emoji: '🧪' },
  { id: 'biology', name: 'ביולוגיה', emoji: '🧬' },
  { id: 'bible', name: 'תנ\'ך', emoji: '📖' },
  { id: 'civics', name: 'אזרחות', emoji: '🏛️' },
  { id: 'literature', name: 'ספרות', emoji: '📚' },
] as const;

export const SYSTEM_LINKS = [
  { name: 'Google Classroom', emoji: '🏫', url: 'https://classroom.google.com' },
  { name: 'וובטופ', emoji: '💻', url: 'https://webtop.smartschool.co.il' },
  { name: 'קמפוס וירטואלי', emoji: '📚', url: 'https://mvc.cet.ac.il' },
  { name: 'קלאסוס', emoji: '📖', url: 'https://my.classoos.com' },
  { name: 'אופק', emoji: '🔭', url: 'https://students.myofek.cet.ac.il' },
  { name: 'קלאס אי', emoji: '🌍', url: 'https://www.classe.world' },
] as const;

export const REFERENCE_LINKS: Record<string, string> = {
  math: 'https://www.matematica.co.il',
  physics: 'https://davidson.weizmann.ac.il/online/physics',
  chemistry: 'https://davidson.weizmann.ac.il/online/chemistry',
  biology: 'https://davidson.weizmann.ac.il/online/biology',
  hebrew: 'https://hebrew.cet.ac.il',
  history: 'https://history.cet.ac.il',
  civics: 'https://civics.cet.ac.il',
  literature: 'https://literature.cet.ac.il',
  bible: 'https://www.safa-ivrit.org/bible',
  english: 'https://www.cet.ac.il/web/english',
};

export const SUBJECT_NAMES: Record<string, string> = {
  math: 'מתמטיקה',
  english: 'אנגלית',
  hebrew: 'עברית',
  history: 'היסטוריה',
  physics: 'פיזיקה',
  chemistry: 'כימיה',
  biology: 'ביולוגיה',
  bible: 'תנ\'ך',
  civics: 'אזרחות',
  literature: 'ספרות',
};

export const WELCOME_ACTIONS = [
  { icon: '📋', title: 'מה יש לי השבוע?', subtitle: 'משימות והגשות', query: 'מה יש לי להגיש השבוע?' },
  { icon: '💡', title: 'לא הבנתי משהו', subtitle: 'הסבר חומר לימוד', query: 'תסביר לי...' },
  { icon: '✏️', title: 'שיעורי בית', subtitle: 'עזרה בתרגילים', query: 'עזור לי עם שיעורי בית' },
  { icon: '🎯', title: 'הכנה למבחן', subtitle: 'תכנון חזרה', query: 'עזור לי להתכונן למבחן' },
] as const;
