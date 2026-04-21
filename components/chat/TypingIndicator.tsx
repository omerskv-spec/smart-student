export function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-xs">
      <div className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white text-xs flex-shrink-0">✦</div>
      <div className="bg-white border border-[rgba(0,0,0,0.06)] rounded-[4px_18px_18px_18px] px-4 py-3 flex gap-1.5 items-center shadow-sm">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[rgba(0,0,0,0.25)] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
