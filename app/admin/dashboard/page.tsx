'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, Trash2, KeyRound, Home, Users, FileDown, LogOut, Shield } from 'lucide-react';
import { DarkModeToggle } from '@/components/dark-mode-toggle';

interface Teacher {
  id: number;
  email: string;
  name: string;
  created_at: string;
  student_count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleteTeacherId, setDeleteTeacherId] = useState<number | null>(null);
  const [resetTeacherId, setResetTeacherId] = useState<number | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchTeachers();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (!response.ok || data.user?.role !== 'admin') {
        router.push('/admin/login');
        return;
      }
      
      setUser(data.user);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers');
      const data = await response.json();
      if (response.ok) {
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deleteTeacherId) return;

    try {
      const response = await fetch(`/api/admin/teachers/${deleteTeacherId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTeachers(teachers.filter((t) => t.id !== deleteTeacherId));
        setDeleteTeacherId(null);
        fetchTeachers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete teacher');
      }
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      alert('Failed to delete teacher');
    }
  };

  const handleResetPassword = async () => {
    if (!resetTeacherId) return;

    setResetting(true);
    try {
      const response = await fetch(`/api/admin/teachers/${resetTeacherId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password' }),
      });

      const data = await response.json();

      if (response.ok) {
        setTempPassword(data.tempPassword);
      } else {
        alert(data.error || 'Failed to reset password');
        setResetTeacherId(null);
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password');
      setResetTeacherId(null);
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin/dashboard')}
              title="Home"
            >
              <Home className="h-5 w-5" />
            </Button>
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <DarkModeToggle />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-primary" />
                <CardTitle>Export Data</CardTitle>
              </div>
              <CardDescription>Download all student data as CSV file</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExport}
                disabled={exporting}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Manage Teachers</CardTitle>
            </div>
            <CardDescription>View and manage all teacher accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No teachers found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.student_count}</TableCell>
                      <TableCell>
                        {new Date(teacher.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResetTeacherId(teacher.id)}
                          >
                            <KeyRound className="h-4 w-4 mr-1" />
                            Reset Password
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTeacherId(teacher.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Teacher Dialog */}
      <AlertDialog open={deleteTeacherId !== null} onOpenChange={() => setDeleteTeacherId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this teacher account and all their students' data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeacher} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetTeacherId !== null && !tempPassword} onOpenChange={() => {
        setResetTeacherId(null);
        setTempPassword(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Teacher Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new temporary password for this teacher. The teacher will need to use this password to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} disabled={resetting}>
              {resetting ? 'Resetting...' : 'Reset Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Show Temporary Password Dialog */}
      <AlertDialog open={tempPassword !== null} onOpenChange={() => {
        setTempPassword(null);
        setResetTeacherId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password Reset Successful</AlertDialogTitle>
            <AlertDialogDescription>
              The teacher's password has been reset. Share this temporary password with them:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 bg-muted rounded-lg">
            <p className="text-2xl font-mono font-bold text-center">{tempPassword}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setTempPassword(null);
              setResetTeacherId(null);
            }}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
