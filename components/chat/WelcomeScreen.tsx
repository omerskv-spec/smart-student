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
      <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-3xl">★</div>
      <div>
        <h2 className="text-2xl font-bold text-[#1A1A1A]">שלום {name}! אני Smart Student 🎓</h2>
        <p className="text-[#6B6B6B] mt-1">מחובר לכיתה {grade} שלך. במה אתחיל לעזור?</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {QUICK.map(q => (
          <button key={q.msg} onClick={() => onQuick(q.msg)}
            className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-4 text-right hover:border-purple-300 hover:bg-[#1A1A1A] transition-all">
            <span className="text-2xl block mb-2">{q.icon}</span>
            <span className="font-medium text-sm text-[#1A1A1A] block">{q.title}</span>
            <span className="text-xs text-[#6B6B6B] block mt-0.5">{q.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
