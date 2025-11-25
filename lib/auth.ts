import bcrypt from 'bcrypt';
import { userQueries } from './db';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(email: string, password: string, name: string, role: 'teacher' | 'admin' = 'teacher') {
  const passwordHash = await hashPassword(password);
  const result = userQueries.create.run(email, passwordHash, name, role);
  return result.lastInsertRowid as number;
}

export async function authenticateUser(email: string, password: string) {
  const user = userQueries.findByEmail.get(email) as { id: number; email: string; password_hash: string; name: string; role: string } | undefined;
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password_hash);
  
  if (!isValid) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'teacher' | 'admin',
  };
}

export function getUserById(id: number) {
  return userQueries.findById.get(id) as { id: number; email: string; name: string; role: string } | undefined;
}


