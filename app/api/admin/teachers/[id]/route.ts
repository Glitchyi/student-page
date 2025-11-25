import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { userQueries } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth('admin');
    const { id } = await params;
    const teacherId = parseInt(id);

    // Don't allow deleting yourself
    if (teacherId === session.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const teacher = userQueries.findById.get(teacherId) as any;
    
    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    if (teacher.role !== 'teacher') {
      return NextResponse.json(
        { error: 'User is not a teacher' },
        { status: 400 }
      );
    }

    // Delete teacher (cascade will delete their students and related data)
    userQueries.delete.run(teacherId);

    return NextResponse.json({ message: 'Teacher deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Delete teacher error:', error);
    return NextResponse.json(
      { error: 'Failed to delete teacher' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth('admin');
    const { id } = await params;
    const teacherId = parseInt(id);
    const body = await request.json();
    const { action } = body;

    if (action !== 'reset_password') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const teacher = userQueries.findById.get(teacherId) as any;
    
    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    if (teacher.role !== 'teacher') {
      return NextResponse.json(
        { error: 'User is not a teacher' },
        { status: 400 }
      );
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const passwordHash = await hashPassword(tempPassword);

    // Update teacher's password
    userQueries.updatePassword.run(passwordHash, teacherId);

    return NextResponse.json({ 
      message: 'Password reset successfully',
      tempPassword: tempPassword // Return temp password so admin can share it
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

