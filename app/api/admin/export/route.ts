import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { studentQueries, studentEventQueries, studentAcademicsQueries, studentValuesQueries } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await requireAuth('admin');

    const allStudents = studentQueries.getAll.all() as any[];
    const allEvents = studentEventQueries.getAll.all() as any[];
    const allAcademics = studentAcademicsQueries.getAll.all() as any[];
    const allValues = studentValuesQueries.getAll.all() as any[];

    // Create maps for quick lookup
    const academicsMap = new Map<number, any>();
    allAcademics.forEach((academic) => {
      academicsMap.set(academic.student_id, academic);
    });

    const valuesMap = new Map<number, any[]>();
    allValues.forEach((value) => {
      if (!valuesMap.has(value.student_id)) {
        valuesMap.set(value.student_id, []);
      }
      valuesMap.get(value.student_id)!.push(value);
    });

    const eventsMap = new Map<number, any[]>();
    allEvents.forEach((event) => {
      if (!eventsMap.has(event.student_id)) {
        eventsMap.set(event.student_id, []);
      }
      eventsMap.get(event.student_id)!.push(event);
    });

    // Create CSV with comprehensive data - one row per student
    const headers = [
      'Student ID',
      'Student Name',
      'Teacher Name',
      'Teacher Email',
      'Academics Percentage',
      'Leadership Score',
      "Bhavan's Values Score",
      'Total Events',
      'Total Points',
      'Events Details',
    ];

    const csvRows: string[] = [headers.join(',')];

    // For each student, create one row
    allStudents.forEach((student) => {
      const academics = academicsMap.get(student.id);
      const values = valuesMap.get(student.id) || [];
      const leadership = values.find((v) => v.value_type === 'Leadership and Responsibility');
      const bhavansValues = values.find((v) => v.value_type === "Bhavan's Values");
      const events = eventsMap.get(student.id) || [];

      // Calculate total points
      const totalPoints = events.reduce((sum, event) => sum + event.points, 0);

      // Format events details as a semicolon-separated list
      const eventsDetails = events.map((event) => {
        return `${event.event_category} - ${event.achievement_level} (${event.is_group ? 'Group' : 'Single'}) - ${event.points}pts - ${event.remark || 'N/A'}`;
      }).join('; ');

      // Create one row per student
      csvRows.push(
        [
          student.id,
          `"${student.name}"`,
          `"${student.teacher_name}"`,
          `"${student.teacher_email}"`,
          academics ? academics.percentage : '',
          leadership ? leadership.score : '',
          bhavansValues ? bhavansValues.score : '',
          events.length,
          totalPoints,
          events.length > 0 ? `"${eventsDetails}"` : '',
        ].join(',')
      );
    });

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="students-export.csv"',
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

