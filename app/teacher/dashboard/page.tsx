'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentList from '@/components/student-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DarkModeToggle } from '@/components/dark-mode-toggle';
import { Home, LogOut, GraduationCap } from 'lucide-react';

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (!response.ok || data.user?.role !== 'teacher') {
        router.push('/');
        return;
      }
      
      setUser(data.user);
    } catch (error) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/teacher/dashboard')}
              title="Home"
              className="h-9 w-9"
            >
              <Home className="h-5 w-5" />
            </Button>
            <GraduationCap className="h-6 w-6 text-primary flex-shrink-0" />
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Welcome, {user?.name}</span>
            <DarkModeToggle />
            <Button variant="outline" onClick={handleLogout} className="whitespace-nowrap">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <StudentList />
      </div>
    </div>
  );
}


