const FIREBASE_API_KEY = 'AIzaSyBywuW-9AiH0EHu16A_FMD1TIXONdxzpXY';

export interface FirebaseUser {
    localId: string;
    email: string;
    displayName?: string;
    photoUrl?: string;
}

export async function verifyFirebaseToken(token: string): Promise<FirebaseUser | null> {
    try {
          const res = await fetch(
                  `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
            {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ idToken: token }),
            }
                );
          if (!res.ok) return null;
          const data = await res.json();
          return data.users?.[0] ?? null;
    } catch {
          return null;
    }
}

export function getAuthToken(req: Request): string | null {
    return req.headers.get('Authorization')?.replace('Bearer ', '') ?? null;
}

export function unauthorized() {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function serverError(message = 'Server error') {
    return Response.json({ error: message }, { status: 500 });
}
