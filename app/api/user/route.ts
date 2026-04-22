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
    // Use Firebase Identity Toolkit REST API to verify ID token
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
      console.error('Firebase token lookup failed:', res.status);
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

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', decoded.uid)
    .single();

  if (error && error.code === 'PGRST116') {
    const newUser = {
      id: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      avatar_url: decoded.photo,
      onboarding_complete: false,
    };
    const { data: created, error: createError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();
    if (createError) return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    return NextResponse.json(created);
  }

  if (error) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(data);
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

  if (error) return NextResponse.json({ error: 'Error saving data' }, { status: 500 });
  return NextResponse.json(data);
}
