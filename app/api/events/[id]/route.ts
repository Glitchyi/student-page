import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { studentQueries, studentEventQueries } from '@/lib/db';
import { calculatePoints, AchievementLevel, EventCategory } from '@/lib/points';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth('teacher');
    const { id } = await params;
    const eventId = parseInt(id);
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

    const event = studentEventQueries.findById.get(eventId) as any;
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const student = studentQueries.findById.get(event.student_id) as any;
    
    // Teachers can only edit events from their own students
    if (student.teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Calculate points
    const points = calculatePoints(achievement_level as AchievementLevel, is_group);

    studentEventQueries.update.run(
      event_category,
      achievement_level,
      is_group ? 1 : 0,
      points,
      remark.trim(),
      eventId
    );

    return NextResponse.json({ message: 'Event updated successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
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
    const eventId = parseInt(id);

    const event = studentEventQueries.findById.get(eventId) as any;
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const student = studentQueries.findById.get(event.student_id) as any;
    
    // Teachers can only delete events from their own students
    if (student.teacher_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    studentEventQueries.delete.run(eventId);

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

