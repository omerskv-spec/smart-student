import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { createServiceClient } from '@/lib/supabase';
import type { ClassroomData, ClassroomAssignment } from '@/types';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

async function verifyToken(request: NextRequest): Promise<{ uid: string; token: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await getAuth().verifyIdToken(token);
    return { uid: decoded.uid, token };
  } catch {
    return null;
  }
}

function formatDate(dueDate?: { year: number; month: number; day: number }): string {
  if (!dueDate) return 'ללא תאריך יעד';
  return `${dueDate.day}/${dueDate.month}/${dueDate.year}`;
}

function buildHebrewSummary(assignments: ClassroomAssignment[]): string {
  if (assignments.length === 0) return 'אין משימות פעילות כרגע.';
  
  const sorted = [...assignments].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    const da = new Date(a.dueDate.year, a.dueDate.month - 1, a.dueDate.day);
    const db = new Date(b.dueDate.year, b.dueDate.month - 1, b.dueDate.day);
    return da.getTime() - db.getTime();
  });

  const lines = sorted.slice(0, 10).map(a => 
    `- ${a.courseName}: ${a.title} (עד ${formatDate(a.dueDate)})`
  );
  
  return `המשימות הקרובות שלך:\n${lines.join('\n')}`;
}

export async function GET(request: NextRequest) {
  const auth = await verifyToken(request);
  if (!auth) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });

  const supabase = createServiceClient();
  
  // Check cache (6 hour TTL)
  const { data: cache } = await supabase
    .from('classroom_cache')
    .select('*')
    .eq('user_id', auth.uid)
    .single();

  if (cache?.data && cache.updated_at) {
    const cacheAge = Date.now() - new Date(cache.updated_at).getTime();
    if (cacheAge < 6 * 60 * 60 * 1000) {
      return NextResponse.json(cache.data);
    }
  }

  // Fetch from Google Classroom
  try {
    const clientId = process.env.GOOGLE_CLASSROOM_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLASSROOM_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      // Return empty data if Classroom not configured
      const emptyData: ClassroomData = { courses: [], assignments: [], lastUpdated: new Date().toISOString(), summary: 'Google Classroom לא מחובר' };
      return NextResponse.json(emptyData);
    }

    // Get user's Google access token
    const { data: userData } = await supabase.from('users').select('*').eq('id', auth.uid).single();
    
    if (!userData) return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });

    // Fetch courses
    const coursesRes = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=6', {
      headers: { Authorization: `Bearer ${auth.token}` }
    });

    if (!coursesRes.ok) {
      const emptyData: ClassroomData = { courses: [], assignments: [], lastUpdated: new Date().toISOString(), summary: 'לא ניתן לגשת ל-Google Classroom' };
      await supabase.from('classroom_cache').upsert({ user_id: auth.uid, data: emptyData, updated_at: new Date().toISOString() });
      return NextResponse.json(emptyData);
    }

    const coursesData = await coursesRes.json();
    const courses = (coursesData.courses || []).map((c: { id: string; name: string; section?: string }) => ({ id: c.id, name: c.name, section: c.section }));

    // Fetch assignments for each course
    const allAssignments: ClassroomAssignment[] = [];
    for (const course of courses.slice(0, 6)) {
      const workRes = await fetch(
        `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?pageSize=8&orderBy=dueDate%20desc`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      if (workRes.ok) {
        const workData = await workRes.json();
        const assignments = (workData.courseWork || []).map((w: ClassroomAssignment) => ({
          ...w,
          courseName: course.name,
        }));
        allAssignments.push(...assignments);
      }
    }

    const data: ClassroomData = {
      courses,
      assignments: allAssignments,
      lastUpdated: new Date().toISOString(),
      summary: buildHebrewSummary(allAssignments),
    };

    await supabase.from('classroom_cache').upsert({ user_id: auth.uid, data, updated_at: new Date().toISOString() });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Classroom API error:', err);
    const errorData: ClassroomData = { courses: [], assignments: [], lastUpdated: new Date().toISOString(), summary: 'שגיאה בטעינת נתוני Classroom' };
    return NextResponse.json(errorData);
  }
}
