import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { userQueries, studentQueries } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('admin');

    // Get all teachers with their student count
    const teachers = userQueries.getAllTeachers.all() as any[];
    
    // Get student count for each teacher
    const teachersWithCounts = teachers.map((teacher) => {
      const studentCount = studentQueries.findByTeacherId.all(teacher.id).length;
      return {
        ...teacher,
        student_count: studentCount,
      };
    });

    return NextResponse.json({ teachers: teachersWithCounts });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Get teachers error:', error);
    return NextResponse.json(
      { error: 'Failed to get teachers' },
      { status: 500 }
    );
  }
}

