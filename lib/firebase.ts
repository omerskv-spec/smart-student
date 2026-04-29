import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBywuW-9AiH0EHu16A_FMD1TIXONdxzpXY',
  authDomain: 'smart-student-6bca3.firebaseapp.com',
  projectId: 'smart-student-6bca3',
  appId: '1:909867168788:web:a1cc486ad8e29e1226e301',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
