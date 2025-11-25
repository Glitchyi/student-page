import { cookies } from 'next/headers';
import { getUserById } from './auth';

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: 'teacher' | 'admin';
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    const sessionData = JSON.parse(sessionCookie.value);
    const user = getUserById(sessionData.userId);
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'teacher' | 'admin',
    };
  } catch {
    return null;
  }
}

export async function createSession(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify({ userId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function requireAuth(requiredRole?: 'teacher' | 'admin'): Promise<SessionUser> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  if (requiredRole && session.role !== requiredRole) {
    throw new Error('Forbidden');
  }
  
  return session;
}


