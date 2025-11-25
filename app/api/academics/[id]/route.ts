import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { studentQueries, studentAcademicsQueries } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth('teacher');
    const { id } = await params;
    const academicsId = parseInt(id);
    const body = await request.json();
    const { percentage } = body;

    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { error: 'Percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    const academics = studentAcademicsQueries.findById.get(academicsId) as any;
    
    if (!academics) {
      return NextResponse.json(
        { error: 'Academics record not found' },
        { status: 404 }
      );
    }

    const student = studentQueries.findById.get(academics.student_id) as any;
    
    // Teachers can only edit academics for their own students
    if (student.teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    studentAcademicsQueries.update.run(percentage, academics.student_id);

    return NextResponse.json({ message: 'Academics updated successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Update academics error:', error);
    return NextResponse.json(
      { error: 'Failed to update academics' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth('teacher');
    const { id } = await params;
    const academicsId = parseInt(id);

    const academics = studentAcademicsQueries.findById.get(academicsId) as any;
    
    if (!academics) {
      return NextResponse.json(
        { error: 'Academics record not found' },
        { status: 404 }
      );
    }

    const student = studentQueries.findById.get(academics.student_id) as any;
    
    // Teachers can only delete academics for their own students
    if (student.teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    studentAcademicsQueries.delete.run(academics.student_id);

    return NextResponse.json({ message: 'Academics deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Delete academics error:', error);
    return NextResponse.json(
      { error: 'Failed to delete academics' },
      { status: 500 }
    );
  }
}

