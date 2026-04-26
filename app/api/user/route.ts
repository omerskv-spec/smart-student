import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, getAuthToken, unauthorized, serverError } from '@/lib/api';
import { getDb } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const token = getAuthToken(req);
    if (!token) return unauthorized();

  const fu = await verifyFirebaseToken(token);
    if (!fu) return unauthorized();

  const uid = fu.localId;
    const { data, error } = await getDb().from('users').select('*').eq('id', uid).single();

  if (error && error.code !== 'PGRST116') {
        console.error('GET user error:', JSON.stringify(error));
        return serverError('DB error');
  }

  return NextResponse.json(data ?? null);
}

export async function POST(req: NextRequest) {
    const token = getAuthToken(req);
    if (!token) return unauthorized();

  const fu = await verifyFirebaseToken(token);
    if (!fu) return unauthorized();

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

  const { data, error } = await getDb()
      .from('users')
      .upsert(newUser, { onConflict: 'id' })
      .select()
      .single();

  if (error) {
        console.error('Upsert error:', JSON.stringify(error));
        return serverError('DB error');
  }

  return NextResponse.json(data);
}
