import type { Metadata } from 'next';
import './globals.css';
import { FirebaseProvider } from '@/components/providers/FirebaseProvider';

export const metadata: Metadata = {
  title: 'Smart Student',
  description: 'עוזר לימודי AI לתלמידי ישראל',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <FirebaseProvider>{children}</FirebaseProvider>
      </body>
    </html>
  );
}
