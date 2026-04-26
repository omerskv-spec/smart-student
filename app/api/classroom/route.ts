import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, getAuthToken } from '@/lib/api';
import { getDb } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
          const token = getAuthToken(req);
          if (!token) return NextResponse.json({ formatted: '' });

      const fu = await verifyFirebaseToken(token);
          if (!fu) return NextResponse.json({ formatted: '' });

      const uid = fu.localId;
          const { data: cache } = await getDb()
            .from('classroom_cache')
            .select('*')
            .eq('user_id', uid)
            .maybeSingle();

      const stale = !cache || new Date(cache.updated_at) < new Date(Date.now() - 6 * 3600 * 1000);
          if (!stale) return NextResponse.json({ formatted: cache.data?.formatted ?? '' });

      const gToken = req.headers.get('X-Google-Token');
          if (!gToken) return NextResponse.json({ formatted: '' });

      const cr = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
              headers: { Authorization: `Bearer ${gToken}` },
      });
          if (!cr.ok) return NextResponse.json({ formatted: '' });

      const courses = ((await cr.json()).courses ?? []).slice(0, 6);
          let formatted = `קורסים: ${courses.map((c: { name: string }) => c.name).join(', ')}\n\n`;

      for (const course of courses) {
              try {
                        const wr = await fetch(
                                    `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?pageSize=5`,
                          { headers: { Authorization: `Bearer ${gToken}` } }
                                  );
                        if (!wr.ok) continue;
                        const works = (await wr.json()).courseWork ?? [];
                        if (works.length) {
                                    formatted += `${course.name}:\n`;
                                    works.forEach((w: { title: string; dueDate?: { day: number; month: number } }) => {
                                                  formatted += `  - ${w.title}${w.dueDate ? ` (${w.dueDate.day}/${w.dueDate.month})` : ''}\n`;
                                    });
                        }
              } catch {
                        continue;
              }
      }

      await getDb().from('classroom_cache').upsert({
              user_id: uid,
              data: { formatted },
              updated_at: new Date().toISOString(),
      });

      return NextResponse.json({ formatted });
    } catch (err) {
          console.error('/api/classroom:', err);
          return NextResponse.json({ formatted: '' });
    }
}
