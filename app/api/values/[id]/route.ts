import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { studentQueries, studentValuesQueries } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth('teacher');
    const { id } = await params;
    const valueId = parseInt(id);
    const body = await request.json();
    const { score } = body;

    if (score === undefined || score < 1 || score > 10) {
      return NextResponse.json(
        { error: 'Score must be between 1 and 10' },
        { status: 400 }
      );
    }

    const value = studentValuesQueries.findById.get(valueId) as any;
    
    if (!value) {
      return NextResponse.json(
        { error: 'Value record not found' },
        { status: 404 }
      );
    }

    const student = studentQueries.findById.get(value.student_id) as any;
    
    // Teachers can only edit values for their own students
    if (student.teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    studentValuesQueries.update.run(score, value.student_id, value.value_type);

    return NextResponse.json({ message: 'Value updated successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Update value error:', error);
    return NextResponse.json(
      { error: 'Failed to update value' },
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
    const valueId = parseInt(id);

    const value = studentValuesQueries.findById.get(valueId) as any;
    
    if (!value) {
      return NextResponse.json(
        { error: 'Value record not found' },
        { status: 404 }
      );
    }

    const student = studentQueries.findById.get(value.student_id) as any;
    
    // Teachers can only delete values for their own students
    if (student.teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    studentValuesQueries.delete.run(valueId);

    return NextResponse.json({ message: 'Value deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Delete value error:', error);
    return NextResponse.json(
      { error: 'Failed to delete value' },
      { status: 500 }
    );
  }
}

