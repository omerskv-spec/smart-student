import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Firebase web API key - public key, safe to embed in server code
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

  const newUser = {
    id: fu.localId,
    email: fu.email ?? '',
    name: fu.displayName ?? '',
    avatar_url: fu.photoUrl ?? '',
    grade: '',
    track: 'כללי',
    subjects: [],
    onboarding_complete: false,
  };

  const { error: insertErr } = await db.from('users').insert(newUser);

  if (insertErr && insertErr.code !== '23505') {
    console.error('Insert error:', JSON.stringify(insertErr));
    return NextResponse.json({ error: insertErr.message, code: insertErr.code }, { status: 500 });
  }

  const { data, error: selectErr } = await db.from('users').select('*').eq('id', fu.localId).single();
  if (selectErr) {
    console.error('Select error:', JSON.stringify(selectErr));
    return NextResponse.json({ error: selectErr.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
  const fu = await getFirebaseUser(token);
  if (!fu) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await db
    .from('users')
    .update(body)
    .eq('id', fu.localId)
    .select()
    .single();

  if (error) {
    console.error('Update error:', JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
