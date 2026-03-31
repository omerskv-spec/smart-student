export function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-xs">
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm flex-shrink-0">★</div>
      <div className="bg-white border border-[var(--border)] rounded-[4px_18px_18px_18px] px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}
