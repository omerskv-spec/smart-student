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
      <body>
        <FirebaseProvider>{children}</FirebaseProvider>
      </body>
    </html>
  );
}
