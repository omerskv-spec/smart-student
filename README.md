# Smart Student

עוזר לימודי AI לתלמידי ישראל

## Setup

1. Clone: `git clone https://github.com/omerskv-spec/smart-student`
2. Install: `npm install`
3. Copy .env.example to .env.local and fill all values
4. Run: `npm run dev`

## Deploy to Vercel

1. Import repo at vercel.com
2. Add all env variables from .env.example
3. Deploy

## Firebase Admin Setup

In Firebase Console → Project Settings → Service Accounts → Generate new private key.
Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to env vars.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript strict
- Firebase Auth (Google OAuth)
- Supabase (PostgreSQL)
- Anthropic Claude API
- Google Classroom API
- Tailwind CSS
