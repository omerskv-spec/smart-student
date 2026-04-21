export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { createServiceClient } from '@/lib/supabase';

function initFirebase() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getAuth();
}

async function verifyToken(request: NextRequest): Promise<{ uid: string; email: string; name: string | null; photo: string | null } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await initFirebase().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || '', name: decoded.name || null, photo: decoded.picture || null };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const decoded = await verifyToken(request);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  
  // Try to get existing user
  const { data, error } = await supabase.from('users').select('*').eq('id', decoded.uid).single();
  
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
    .update({ grade, track, subjects, onboarding_complete: onboarding_complete ?? true, updated_at: new Date().toISOString() })
    .eq('id', decoded.uid)
    .select()
    .single();
    
  if (error) return NextResponse.json({ error: 'Error saving data' }, { status: 500 });
  return NextResponse.json(data);
}
