import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { studentQueries, studentEventQueries } from '@/lib/db';
import { calculatePoints, AchievementLevel, EventCategory } from '@/lib/points';

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

    const events = studentEventQueries.findByStudentId.all(studentId) as any[];
    return NextResponse.json({ events });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Failed to get events' },
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
    const { event_category, achievement_level, is_group, remark } = body;

    if (!event_category || !achievement_level || typeof is_group !== 'boolean') {
      return NextResponse.json(
        { error: 'Event category, achievement level, and is_group are required' },
        { status: 400 }
      );
    }

    if (!remark || remark.trim() === '') {
      return NextResponse.json(
        { error: 'Remark is required' },
        { status: 400 }
      );
    }

    // Validate event_category
    const validCategories: EventCategory[] = ['Literary', 'Sports', 'Arts', 'Science/Maths'];
    if (!validCategories.includes(event_category)) {
      return NextResponse.json(
        { error: 'Invalid event category' },
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

    // Teachers can only add events to their own students
    if (student.teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Calculate points
    const points = calculatePoints(achievement_level as AchievementLevel, is_group);

    const result = studentEventQueries.create.run(
      studentId,
      event_category,
      achievement_level,
      is_group ? 1 : 0,
      points,
      remark.trim()
    );

    return NextResponse.json(
      { message: 'Event added successfully', eventId: result.lastInsertRowid },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

