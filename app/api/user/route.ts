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
async function verifyToken(request: NextRequest): Promise<string | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
          const token = authHeader.split('Bearer ')[1];
          const decoded = await initFirebase().verifyIdToken(token);
          return decoded.uid;
    } catch {
          return null;
    }
}
export async function POST(request: NextRequest) {
    const uid = await verifyToken(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { grade, track, subjects } = body;
    if (!grade || !track || !Array.isArray(subjects) || subjects.length === 0) {
          return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('users')
      .update({ grade, track, subjects, onboarding_complete: true, updated_at: new Date().toISOString() })
      .eq('id', uid)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Error saving data' }, { status: 500 });
    return NextResponse.json(data);
}
export async function GET(request: NextRequest) {
    const uid = await verifyToken(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServiceClient();
    const { data, error } = await supabase.from('users').select('*').eq('id', uid).single();
    if (error) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(data);
}
