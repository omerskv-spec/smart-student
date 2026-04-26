'use client';
import { useState, useRef, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { UploadedFiles, type UploadedFile } from './UploadedFiles';

interface Props {
  onSend: (msg: string) => void;
  disabled: boolean;
  token: string;
  conversationId: string | null;
}

export function InputBar({ onSend, disabled, token, conversationId }: Props) {
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${Math.min(ref.current.scrollHeight, 120)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const msg = value.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setValue('');
    if (ref.current) ref.current.style.height = 'auto';
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleUpload = useCallback((file: UploadedFile) => {
    setFiles(prev => [...prev, file]);
    setUploadError('');
  }, []);

  const handleRemove = useCallback(async (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    try {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Silently fail - file is removed from UI regardless
    }
  }, [token]);

  const handleError = useCallback((msg: string) => {
    setUploadError(msg);
    setTimeout(() => setUploadError(''), 4000);
  }, []);

  const isFocused = value.length > 0;

  return (
    <div className="bg-[#F5F4EF] border-t border-[rgba(0,0,0,0.08)]">
      <UploadedFiles files={files} onRemove={handleRemove} />

      <div className="p-3">
        {uploadError && (
          <div className="mb-2 px-3 py-2 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">
            {uploadError}
          </div>
        )}

        <div
          className={`flex gap-2 items-end bg-white border rounded-2xl px-3 py-2.5 transition-all duration-150 shadow-sm ${
            isFocused ? 'border-[rgba(0,0,0,0.22)]' : 'border-[rgba(0,0,0,0.08)]'
          }`}
        >
          <FileUpload
            token={token}
            conversationId={conversationId}
            onUpload={handleUpload}
            onError={handleError}
          />

          <textarea
            ref={ref}
            value={value}
            onChange={e => { setValue(e.target.value); resize(); }}
            onKeyDown={handleKeyDown}
            placeholder="\u05e9\u05d0\u05dc \u05e9\u05d0\u05dc\u05d4, \u05d0\u05d5 \u05d4\u05e2\u05dc\u05d4 \u05d7\u05d5\u05de\u05e8 \u05dc\u05d9\u05de\u05d5\u05d3..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#1A1A1A] placeholder-[#9B9B9B] resize-none min-h-[24px] max-h-[120px] leading-relaxed"
          />

          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="w-8 h-8 bg-[#1A1A1A] hover:bg-[#2A2A2A] disabled:bg-[rgba(0,0,0,0.08)] disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150"
            aria-label="\u05e9\u05dc\u05d7 \u05d4\u05d5\u05d3\u05e2\u05d4"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l3 6-3 6 12-6z" fill="white"/>
            </svg>
          </button>
        </div>

        <p className="text-[10px] text-[#9B9B9B] text-center mt-1.5 select-none">
          Enter \u05dc\u05e9\u05dc\u05d9\u05d7\u05d4 · Shift+Enter \u05e9\u05d5\u05e8\u05d4 \u05d7\u05d3\u05e9\u05d4 · PDF, \u05ea\u05de\u05d5\u05e0\u05d4, \u05d0\u05d5 \u05d8\u05e7\u05e1\u05d8
        </p>
      </div>
    </div>
  );
}
