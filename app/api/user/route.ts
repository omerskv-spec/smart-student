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
    // Use Google's tokeninfo endpoint to verify Firebase ID tokens
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
    if (!res.ok) return null;
    const data = await res.json();
    
    // Verify it's for our Firebase project
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (data.aud !== projectId) return null;
    
    return {
      uid: data.sub,
      email: data.email || '',
      name: data.name || null,
      photo: data.picture || null,
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

  // Try to get existing user
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', decoded.uid)
    .single();

  if (error && error.code === 'PGRST116') {
    // User not found — create new user (first login)
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
