import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { studentQueries, studentValuesQueries } from '@/lib/db';

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

    const values = studentValuesQueries.findByStudentId.all(studentId) as any[];
    return NextResponse.json({ values });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get values error:', error);
    return NextResponse.json(
      { error: 'Failed to get values' },
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
    const { value_type, score } = body;

    if (!value_type || (value_type !== 'Leadership and Responsibility' && value_type !== "Bhavan's Values")) {
      return NextResponse.json(
        { error: 'Invalid value type. Must be "Leadership and Responsibility" or "Bhavan\'s Values"' },
        { status: 400 }
      );
    }

    if (score === undefined || score < 1 || score > 10) {
      return NextResponse.json(
        { error: 'Score must be between 1 and 10' },
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

    // Teachers can only add values to their own students
    if (student.teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Upsert (create or update)
    studentValuesQueries.upsert.run(studentId, value_type, score);

    return NextResponse.json(
      { message: 'Value saved successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Create/update value error:', error);
    return NextResponse.json(
      { error: 'Failed to save value' },
      { status: 500 }
    );
  }
}

