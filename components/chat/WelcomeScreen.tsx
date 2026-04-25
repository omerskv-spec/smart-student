interface Props { name: string; grade: string; onQuick: (msg: string) => void; }

const QUICK = [
  { title: 'מה יש לי השבוע?', sub: 'משימות והגשות', msg: 'מה יש לי להגיש השבוע?' },
  { title: 'לא הבנתי משהו', sub: 'הסבר חומר לימוד', msg: 'לא הבנתי את החומר בשיעור, תסביר לי' },
  { title: 'שיעורי בית', sub: 'עזרה בתרגילים', msg: 'תעזור לי עם שיעורי הבית שלי' },
  { title: 'הכנה למבחן', sub: 'תכנון חזרה', msg: 'מתי המבחן הבא שלי ואיך אני מתכונן?' },
];

export function WelcomeScreen({ name, grade, onQuick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 py-16 px-6 text-center">
      <div className="space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-white text-lg font-semibold mx-auto">
          S
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">
          {name ? `שלום, ${name}` : 'שלום'}
        </h2>
        <p className="text-sm text-[#6B6B6B]">
          {grade ? `כיתה ${grade}` : 'Smart Student'} — במה אוכל לעזור היום?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
        {QUICK.map(q => (
          <button
            key={q.msg}
            onClick={() => onQuick(q.msg)}
            className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-4 text-right hover:border-[rgba(0,0,0,0.18)] hover:shadow-sm transition-all duration-200 group"
          >
            <span className="font-medium text-sm text-[#1A1A1A] block leading-snug group-hover:text-[#000]">
              {q.title}
            </span>
            <span className="text-[11px] text-[#9B9B9B] block mt-1">
              {q.sub}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
