interface Props { name: string; grade: string; onQuick: (msg: string) => void; }

const QUICK = [
  { icon: '📋', title: 'מה יש לי השבוע?', sub: 'משימות והגשות', msg: 'מה יש לי להגיש השבוע?' },
  { icon: '💡', title: 'לא הבנתי משהו', sub: 'הסבר חומר לימוד', msg: 'לא הבנתי את החומר, תסביר לי' },
  { icon: '✏️', title: 'שיעורי בית', sub: 'עזרה בתרגילים', msg: 'תעזור לי עם שיעורי הבית שלי' },
  { icon: '🎯', title: 'הכנה למבחן', sub: 'תכנון חזרה', msg: 'מתי המבחן הבא ואיך אני מתכונן?' },
];

export function WelcomeScreen({ name, grade, onQuick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-3xl">★</div>
      <div>
        <h2 className="text-2xl font-bold text-purple-900">שלום {name}! אני Smart Student 🎓</h2>
        <p className="text-[var(--muted)] mt-1">מחובר לכיתה {grade} שלך. במה אתחיל לעזור?</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {QUICK.map(q => (
          <button key={q.msg} onClick={() => onQuick(q.msg)}
            className="bg-white border border-[var(--border)] rounded-2xl p-4 text-right hover:border-purple-300 hover:bg-purple-50 transition-all">
            <span className="text-2xl block mb-2">{q.icon}</span>
            <span className="font-medium text-sm text-[var(--text)] block">{q.title}</span>
            <span className="text-xs text-[var(--muted)] block mt-0.5">{q.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
