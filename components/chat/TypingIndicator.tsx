import { useEffect, useState } from 'react';

interface Props {
  agentName?: string;
}

const THINKING_PHRASES = [
  'חושב',
  'מנתח את השאלה',
  'מכין תשובה',
  'בודק את החומר',
  'מעבד',
];

export function TypingIndicator({ agentName }: Props) {
  const [phrase, setPhrase] = useState(THINKING_PHRASES[0]);
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const phraseInterval = setInterval(() => {
      setPhrase(prev => {
        const currentIndex = THINKING_PHRASES.indexOf(prev);
        return THINKING_PHRASES[(currentIndex + 1) % THINKING_PHRASES.length];
      });
    }, 2000);

    const dotInterval = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 400);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(dotInterval);
    };
  }, []);

  return (
    <div className="flex gap-3 max-w-lg">
      <div className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5">
        S
      </div>
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[2px_16px_16px_16px] px-4 py-3 shadow-sm min-w-[160px]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#6B6B6B]">
            {agentName ? `${agentName} ` : ''}{phrase}
          </span>
          <span className="text-sm text-[#9B9B9B] font-mono tracking-wider w-6">
            {'.'.repeat(dotCount)}
          </span>
        </div>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="h-0.5 rounded-full bg-[rgba(0,0,0,0.12)] flex-1 overflow-hidden"
            >
              <div
                className="h-full bg-[#1A1A1A] rounded-full"
                style={{
                  animation: 'loading-bar 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                  width: '40%',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
            }
