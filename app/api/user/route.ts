export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

interface DecodedToken {
  uid: string;
  email: string;
  name: string | null;
  photo: string | null;
}

async function verifyToken(request: NextRequest): Promise<DecodedToken | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!res.ok) {
      console.error('Firebase token lookup failed:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const user = data.users?.[0];
    if (!user) return null;
    
    return {
      uid: user.localId,
      email: user.email || '',
      name: user.displayName || null,
      photo: user.photoUrl || null,
    };
  } catch (err) {
    console.error('Token verification error:', err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const decoded = await verifyToken(request);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();

  // Upsert: insert if not exists, return current
  const { data: upserted, error: upsertError } = await supabase
    .from('users')
    .upsert(
      {
        id: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        avatar_url: decoded.photo,
        onboarding_complete: false,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    .select()
    .single();

  if (upsertError) {
    console.error('Upsert error:', upsertError);
    // If upsert failed (e.g. conflict), just fetch the existing user
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.uid)
      .single();
    if (fetchError || !existing) {
      console.error('Fetch after upsert error:', fetchError);
      return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
    }
    return NextResponse.json(existing);
  }

  return NextResponse.json(upserted);
}

export async function POST(request: NextRequest) {
  const decoded = await verifyToken(request);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { grade, track, subjects, onboarding_complete } = body;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .update({
      grade,
      track,
      subjects,
      onboarding_complete: onboarding_complete ?? true,
      updated_at: new Date().toISOString()
    })
    .eq('id', decoded.uid)
    .select()
    .single();

  if (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Error saving data' }, { status: 500 });
  }
  return NextResponse.json(data);
}
