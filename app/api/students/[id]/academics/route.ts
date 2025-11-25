import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { studentQueries, studentAcademicsQueries } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const studentId = parseInt(id);

    const student = studentQueries.findById.get(studentId) as any;
    
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Teachers can only access their own students
    if (session.role === 'teacher' && student.teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const academics = studentAcademicsQueries.findByStudentId.get(studentId) as any;
    return NextResponse.json({ academics: academics || null });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get academics error:', error);
    return NextResponse.json(
      { error: 'Failed to get academics' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth('teacher');
    const { id } = await params;
    const studentId = parseInt(id);
    const body = await request.json();
    const { percentage } = body;

    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { error: 'Percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    const student = studentQueries.findById.get(studentId) as any;
    
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Teachers can only add academics to their own students
    if (student.teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Upsert (create or update)
    studentAcademicsQueries.upsert.run(studentId, percentage);

    return NextResponse.json(
      { message: 'Academics saved successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Create/update academics error:', error);
    return NextResponse.json(
      { error: 'Failed to save academics' },
      { status: 500 }
    );
  }
}

