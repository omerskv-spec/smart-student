'use client';
import { useState, useRef, useCallback } from 'react';

interface UploadedFile {
  id: string;
  filename: string;
  size: number;
}

interface Props {
  token: string;
  conversationId: string | null;
  onUpload: (file: UploadedFile) => void;
  onError: (message: string) => void;
}

const ACCEPTED = '.pdf,.txt,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function FileUpload({ token, conversationId, onUpload, onError }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      if (conversationId) body.append('conversationId', conversationId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '\u05e9\u05d2\u05d9\u05d0\u05d4 \u05d1\u05d4\u05e2\u05dc\u05d0\u05d4');

      onUpload({ id: json.id, filename: json.filename, size: json.size });
    } catch (err) {
      onError(err instanceof Error ? err.message : '\u05e9\u05d2\u05d9\u05d0\u05d4 \u05d1\u05d4\u05e2\u05dc\u05d0\u05ea \u05d4\u05e7\u05d5\u05d1\u05e5');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [token, conversationId, onUpload, onError]);

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-8 h-8 flex items-center justify-center rounded-xl border border-[rgba(0,0,0,0.12)] bg-transparent hover:bg-[rgba(0,0,0,0.04)] transition-all disabled:opacity-40 flex-shrink-0"
        title="\u05d4\u05e2\u05dc\u05d4 \u05e7\u05d5\u05d1\u05e5 \u05dc\u05d9\u05de\u05d5\u05d3"
        aria-label="\u05d4\u05e2\u05dc\u05d4 \u05e7\u05d5\u05d1\u05e5"
      >
        {uploading ? (
          <div className="w-3.5 h-3.5 border-[1.5px] border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 1.5v8M5 4.5l3-3 3 3"/>
            <path d="M2.5 11v2a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-2"/>
          </svg>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
    </>
  );
}
