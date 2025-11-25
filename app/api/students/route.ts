import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { studentQueries, transactions } from '@/lib/db';
import { calculatePoints, AchievementLevel, EventCategory } from '@/lib/points';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all') === 'true';

    if (session.role === 'admin' && all) {
      // Admin can see all students
      const students = studentQueries.getAll.all() as any[];
      return NextResponse.json({ students });
    } else {
      // Teachers only see their own students
      const students = studentQueries.findByTeacherId.all(session.id) as any[];
      return NextResponse.json({ students });
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get students error:', error);
    return NextResponse.json(
      { error: 'Failed to get students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('teacher');
    const body = await request.json();
    const { name, academics, events, values } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Student name is required' },
        { status: 400 }
      );
    }

    // Academics is required
    if (!academics || academics.percentage === undefined) {
      return NextResponse.json(
        { error: 'Academics percentage is required' },
        { status: 400 }
      );
    }

    if (academics.percentage < 0 || academics.percentage > 100) {
      return NextResponse.json(
        { error: 'Academics percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Values are required (both Leadership and Bhavan's Values)
    if (!values || !Array.isArray(values) || values.length !== 2) {
      return NextResponse.json(
        { error: 'Both Leadership and Responsibility and Bhavan\'s Values scores are required' },
        { status: 400 }
      );
    }

    const leadership = values.find(v => v.value_type === 'Leadership and Responsibility');
    const bhavans = values.find(v => v.value_type === "Bhavan's Values");

    if (!leadership || !bhavans) {
      return NextResponse.json(
        { error: 'Both Leadership and Responsibility and Bhavan\'s Values scores are required' },
        { status: 400 }
      );
    }

    for (const value of values) {
      if (!value.value_type || (value.value_type !== 'Leadership and Responsibility' && value.value_type !== "Bhavan's Values")) {
        return NextResponse.json(
          { error: 'Invalid value type' },
          { status: 400 }
        );
      }
      if (value.score === undefined || value.score < 1 || value.score > 10) {
        return NextResponse.json(
          { error: 'Value score must be between 1 and 10' },
          { status: 400 }
        );
      }
    }

    // Validate events if provided
    if (events && Array.isArray(events) && events.length > 0) {
      for (const event of events) {
        if (!event.remark || event.remark.trim() === '') {
          return NextResponse.json(
            { error: 'Remark is required for all events' },
            { status: 400 }
          );
        }
        if (!event.event_category || !['Literary', 'Sports', 'Arts', 'Science/Maths'].includes(event.event_category)) {
          return NextResponse.json(
            { error: 'Invalid event category' },
            { status: 400 }
          );
        }
        if (!event.achievement_level) {
          return NextResponse.json(
            { error: 'Achievement level is required' },
            { status: 400 }
          );
        }
      }
    }

    // Format events for transaction
    const formattedEvents = events && Array.isArray(events) && events.length > 0
      ? events.map((event: { event_category: string; achievement_level: string; is_group: boolean; remark: string }) => ({
          event_category: event.event_category,
          achievement_level: event.achievement_level,
          is_group: event.is_group ? 1 : 0,
          points: calculatePoints(event.achievement_level as AchievementLevel, event.is_group),
          remark: event.remark.trim(),
        }))
      : undefined;

    // Format values for transaction (both are required)
    const formattedValues = values.map((value: { value_type: string; score: number }) => ({
      value_type: value.value_type,
      score: value.score,
    }));

    // Use transaction to create student with all data
    const studentId = transactions.createStudentWithData(
      { teacher_id: session.id, name },
      {
        academics: { percentage: academics.percentage },
        events: formattedEvents,
        values: formattedValues,
      }
    );

    return NextResponse.json(
      { message: 'Student created successfully', studentId },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

