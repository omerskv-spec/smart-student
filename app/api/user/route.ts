import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getFirebaseUser(token: string) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) }
  );
  const d = await r.json();
  return r.ok ? d.users?.[0] ?? null : null;
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

  // Try insert — if exists (23505), just select
  const { error: insertErr } = await db.from('users').insert(newUser);

  if (insertErr && insertErr.code !== '23505') {
    console.error('Insert error:', insertErr);
    return NextResponse.json({ error: insertErr.message, code: insertErr.code }, { status: 500 });
  }

  const { data, error: selectErr } = await db.from('users').select('*').eq('id', fu.localId).single();
  if (selectErr) {
    console.error('Select error:', selectErr);
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
    console.error('Update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
