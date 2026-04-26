'use client';

export interface UploadedFile {
  id: string;
  filename: string;
  size: number;
}

interface Props {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fileLabel(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: 'PDF', png: 'IMG', jpg: 'IMG', jpeg: 'IMG',
    gif: 'IMG', webp: 'IMG', doc: 'DOC', docx: 'DOC', txt: 'TXT',
  };
  return map[ext] ?? 'FILE';
}

export function UploadedFiles({ files, onRemove }: Props) {
  if (files.length === 0) return null;

  return (
    <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5">
      {files.map(f => (
        <div
          key={f.id}
          className="flex items-center gap-1.5 bg-white border border-[rgba(0,0,0,0.08)] rounded-lg px-2.5 py-1.5 text-xs group max-w-[200px]"
        >
          <span className="font-mono text-[9px] font-semibold text-[#6B6B6B] bg-[#F0EFEA] px-1 py-0.5 rounded flex-shrink-0">
            {fileLabel(f.filename)}
          </span>
          <span className="text-[#1A1A1A] truncate">{f.filename}</span>
          <span className="text-[#9B9B9B] flex-shrink-0 text-[10px]">{formatSize(f.size)}</span>
          <button
            onClick={() => onRemove(f.id)}
            className="text-[#C0BDBA] hover:text-[#1A1A1A] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 leading-none"
            aria-label={`\u05d4\u05e1\u05e8 ${f.filename}`}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
