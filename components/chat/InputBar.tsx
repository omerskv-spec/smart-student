'use client';
import { useState, useRef, useCallback } from 'react';

interface Props {
  onSend: (msg: string) => void;
  disabled: boolean;
}

export function InputBar({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = Math.min(ref.current.scrollHeight, 120) + 'px';
    }
  };

  const handleSend = useCallback(() => {
    const msg = value.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setValue('');
    if (ref.current) ref.current.style.height = 'auto';
  }, [value, disabled, onSend]);

  return (
    <div className="p-3 bg-[#F5F4EF] border-t border-[rgba(0,0,0,0.08)]">
      <div className={`flex gap-2 items-end bg-white border rounded-2xl px-4 py-2.5 transition-all shadow-sm ${value ? 'border-[rgba(0,0,0,0.2)]' : 'border-[rgba(0,0,0,0.08)]'}`}>
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="w-8 h-8 bg-[#1A1A1A] hover:bg-[#2A2A2A] disabled:bg-[rgba(0,0,0,0.1)] text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M14 8L2 2l3 6-3 6 12-6z" fill="white"/>
          </svg>
        </button>
        <textarea
          ref={ref}
          value={value}
          onChange={e => { setValue(e.target.value); resize(); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="שאל אותי כל דבר על הלימודים שלך..."
          rows={1}
          className="flex-1 bg-transparent border-none outline-none text-sm text-[#1A1A1A] placeholder-[#9B9B9B] resize-none min-h-[24px] max-h-[120px] leading-relaxed"
        />
      </div>
      <p className="text-[10px] text-[#9B9B9B] text-center mt-1.5">Enter לשליחה · Shift+Enter לשורה חדשה</p>
    </div>
  );
}
