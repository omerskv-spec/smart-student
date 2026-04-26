import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, getAuthToken, unauthorized, serverError } from '@/lib/api';
import { getDb } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'text/plain',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

async function extractText(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    const text = await file.text();
    return text.slice(0, 50000);
  }

  if (file.type === 'application/pdf') {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const chars: string[] = [];
    for (let i = 0; i < bytes.length; i++) {
      const c = bytes[i];
      if ((c >= 0x20 && c <= 0x7e) || (c >= 0xd7 && c <= 0xfa)) {
        chars.push(String.fromCharCode(c));
      } else if (c === 0x0a || c === 0x0d) {
        chars.push('\n');
      }
    }
    return chars.join('').replace(/\s{4,}/g, '\n\n').trim().slice(0, 50000);
  }

  if (file.type.startsWith('image/')) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    return `IMAGE:${file.type}:${base64}`;
  }

  try {
    const text = await file.text();
    return text.slice(0, 50000);
  } catch {
    return `[\u05e7\u05d5\u05d1\u05e5: ${file.name}]`;
  }
}

export async function POST(req: NextRequest) {
  const token = getAuthToken(req);
  if (!token) return unauthorized();

  const fu = await verifyFirebaseToken(token);
  if (!fu) return unauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const conversationId = formData.get('conversationId') as string | null;

    if (!file) {
      return NextResponse.json({ error: '\u05dc\u05d0 \u05e0\u05e9\u05dc\u05d7 \u05e7\u05d5\u05d1\u05e5' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '\u05d4\u05e7\u05d5\u05d1\u05e5 \u05d2\u05d3\u05d5\u05dc \u05de\u05d3\u05d9. \u05de\u05e7\u05e1\u05d9\u05de\u05d5\u05dd 10MB' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: '\u05e1\u05d5\u05d2 \u05e7\u05d5\u05d1\u05e5 \u05dc\u05d0 \u05e0\u05ea\u05de\u05da' },
        { status: 400 }
      );
    }

    const content = await extractText(file);

    const { data, error } = await getDb()
      .from('student_files')
      .insert({
        user_id: fu.localId,
        filename: file.name,
        file_type: file.type,
        content,
        size_bytes: file.size,
        conversation_id: conversationId || null,
      })
      .select('id, filename, size_bytes')
      .single();

    if (error) {
      console.error('Upload insert error:', error);
      return serverError('\u05e9\u05d2\u05d9\u05d0\u05d4 \u05d1\u05e9\u05de\u05d9\u05e8\u05ea \u05d4\u05e7\u05d5\u05d1\u05e5');
    }

    return NextResponse.json({
      id: data.id,
      filename: data.filename,
      size: data.size_bytes,
      preview: content.startsWith('IMAGE:') ? null : content.slice(0, 200),
    });
  } catch (err) {
    console.error('/api/upload error:', err);
    return serverError('\u05e9\u05d2\u05d9\u05d0\u05d4 \u05d1\u05d4\u05e2\u05dc\u05d0\u05ea \u05d4\u05e7\u05d5\u05d1\u05e5');
  }
}

export async function DELETE(req: NextRequest) {
  const token = getAuthToken(req);
  if (!token) return unauthorized();

  const fu = await verifyFirebaseToken(token);
  if (!fu) return unauthorized();

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: '\u05d7\u05e1\u05e8 \u05de\u05d6\u05d4\u05d4 \u05e7\u05d5\u05d1\u05e5' }, { status: 400 });

    const { error } = await getDb()
      .from('student_files')
      .delete()
      .eq('id', id)
      .eq('user_id', fu.localId);

    if (error) return serverError();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('/api/upload DELETE error:', err);
    return serverError();
  }
}
