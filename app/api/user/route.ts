import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Hardcoded to bypass stale Vercel env vars
const db = createClient(
  'https://tvckyeplbdemdpnzxhni.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Y2t5ZXBsYmRlbWRwbnp4aG5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk1NTk3MCwiZXhwIjoyMDkwNTMxOTcwfQ.9taeVXMWyiqa_koKoI_qXzhNO4ittHJG9dPOxh1pMas'
);

// Firebase web API key - hardcoded to bypass stale env var
const FIREBASE_API_KEY = 'AIzaSyBywuW-9AiH0EHu16A_FMD1TIXONdxzpXY';

async function getFirebaseUser(token: string) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) }
  );
  const d = await r.json();
  if (!r.ok) {
    console.error('Firebase lookup error:', JSON.stringify(d));
    return null;
  }
  return d.users?.[0] ?? null;
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

  const fu = await getFirebaseUser(token);
  if (!fu) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const uid = fu.localId;

  const { data, error } = await db.from('users').select('*').eq('id', uid).single();
  if (error && error.code !== 'PGRST116') {
    console.error('GET user error:', JSON.stringify(error));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

  const fu = await getFirebaseUser(token);
  if (!fu) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const uid = fu.localId;
  const body = await req.json();

  const newUser = {
    id: uid,
    email: fu.email ?? '',
    name: fu.displayName ?? '',
    avatar_url: fu.photoUrl ?? '',
    grade: body.grade ?? '',
    track: body.track ?? '',
    subjects: body.subjects ?? [],
    onboarding_complete: body.onboarding_complete ?? false,
  };

  const { data, error } = await db
    .from('users')
    .upsert(newUser, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Upsert error:', JSON.stringify(error));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json(data);
}
