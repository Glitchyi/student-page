'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ACHIEVEMENT_LEVELS, AchievementLevel, EVENT_CATEGORIES, EventCategory, calculatePoints } from '@/lib/points';
import { Trash2, Edit, Home, ArrowLeft, User, GraduationCap, Award, Trophy, BookOpen, Users, Target, Save, X, Plus } from 'lucide-react';
import { DarkModeToggle } from '@/components/dark-mode-toggle';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Student {
  id: number;
  name: string;
  teacher_id: number;
}

interface Event {
  id: number;
  event_category: string;
  achievement_level: string;
  is_group: number;
  points: number;
  remark: string;
  created_at: string;
}

interface Academics {
  id: number;
  student_id: number;
  percentage: number;
}

interface Value {
  id: number;
  student_id: number;
  value_type: string;
  score: number;
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = parseInt(params.id as string);

  const [student, setStudent] = useState<Student | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [academics, setAcademics] = useState<Academics | null>(null);
  const [values, setValues] = useState<Value[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  const [editEventId, setEditEventId] = useState<number | null>(null);

  // Form state
  const [editMode, setEditMode] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Academics form state
  const [academicsPercentage, setAcademicsPercentage] = useState<number | ''>('');

  // Values form state
  const [leadershipScore, setLeadershipScore] = useState<number | ''>('');
  const [bhavansScore, setBhavansScore] = useState<number | ''>('');

  // Event form state
  const [eventCategory, setEventCategory] = useState<EventCategory>('Literary');
  const [achievementLevel, setAchievementLevel] = useState<AchievementLevel>('National Winner');
  const [isGroup, setIsGroup] = useState(false);
  const [remark, setRemark] = useState('');

  // Edit event state
  const [editEventCategory, setEditEventCategory] = useState<EventCategory>('Literary');
  const [editAchievementLevel, setEditAchievementLevel] = useState<AchievementLevel>('National Winner');
  const [editIsGroup, setEditIsGroup] = useState(false);
  const [editRemark, setEditRemark] = useState('');

  useEffect(() => {
    checkAuth();
    fetchStudent();
    fetchEvents();
    fetchAcademics();
    fetchValues();
  }, [studentId]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (!response.ok || data.user?.role !== 'teacher') {
        router.push('/');
      }
    } catch (error) {
      router.push('/');
    }
  };

  const fetchStudent = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}`);
      const data = await response.json();
      if (response.ok) {
        setStudent(data.student);
        setStudentName(data.student.name);
      }
    } catch (error) {
      console.error('Failed to fetch student:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}/events`);
      const data = await response.json();
      if (response.ok) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademics = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}/academics`);
      const data = await response.json();
      if (response.ok && data.academics) {
        setAcademics(data.academics);
        setAcademicsPercentage(data.academics.percentage);
      }
    } catch (error) {
      console.error('Failed to fetch academics:', error);
    }
  };

  const fetchValues = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}/values`);
      const data = await response.json();
      if (response.ok) {
        setValues(data.values || []);
        const leadership = data.values.find((v: Value) => v.value_type === 'Leadership and Responsibility');
        const bhavans = data.values.find((v: Value) => v.value_type === "Bhavan's Values");
        if (leadership) setLeadershipScore(leadership.score);
        if (bhavans) setBhavansScore(bhavans.score);
      }
    } catch (error) {
      console.error('Failed to fetch values:', error);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update student');
        setSubmitting(false);
        return;
      }

      setEditMode(false);
      fetchStudent();
      setSubmitting(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSaveAcademics = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/students/${studentId}/academics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage: academicsPercentage }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save academics');
        setSubmitting(false);
        return;
      }

      fetchAcademics();
      setSubmitting(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSaveValues = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Validate both values are provided
    if (leadershipScore === '' || bhavansScore === '') {
      setError('Both Leadership and Responsibility and Bhavan\'s Values scores are required');
      setSubmitting(false);
      return;
    }

    try {
      const promises = [
        fetch(`/api/students/${studentId}/values`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            value_type: 'Leadership and Responsibility',
            score: leadershipScore 
          }),
        }),
        fetch(`/api/students/${studentId}/values`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            value_type: "Bhavan's Values",
            score: bhavansScore 
          }),
        })
      ];

      const responses = await Promise.all(promises);
      const hasError = responses.some(r => !r.ok);

      if (hasError) {
        setError('Failed to save values');
        setSubmitting(false);
        return;
      }

      fetchValues();
      setSubmitting(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/students/${studentId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event_category: eventCategory,
          achievement_level: achievementLevel,
          is_group: isGroup,
          remark: remark,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add event');
        setSubmitting(false);
        return;
      }

      setEventCategory('Literary');
      setAchievementLevel('National Winner');
      setIsGroup(false);
      setRemark('');
      fetchEvents();
      setSubmitting(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditEventId(event.id);
    setEditEventCategory(event.event_category as EventCategory);
    setEditAchievementLevel(event.achievement_level as AchievementLevel);
    setEditIsGroup(event.is_group === 1);
    setEditRemark(event.remark || '');
    setError('');
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEventId) return;

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/events/${editEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event_category: editEventCategory,
          achievement_level: editAchievementLevel,
          is_group: editIsGroup,
          remark: editRemark,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update event');
        setSubmitting(false);
        return;
      }

      setEditEventId(null);
      fetchEvents();
      setSubmitting(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventId) return;

    try {
      const response = await fetch(`/api/events/${deleteEventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(events.filter((e) => e.id !== deleteEventId));
        setDeleteEventId(null);
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const totalPoints = events.reduce((sum, event) => sum + event.points, 0);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!student) {
    return <div className="p-4">Student not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/teacher/dashboard')}
              title="Home"
            >
              <Home className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={() => router.push('/teacher/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <DarkModeToggle />
        </div>

        <Card className="bg-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Student Details</CardTitle>
                  <CardDescription>Manage student information and events</CardDescription>
                </div>
              </div>
              {!editMode && (
                <Button variant="outline" onClick={() => setEditMode(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Name
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <form onSubmit={handleUpdateStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Student Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {submitting ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setStudentName(student?.name || '');
                      setError('');
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-2xl font-bold">{student.name}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Points: {totalPoints}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academics Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle>Academics <span className="text-destructive">*</span></CardTitle>
            </div>
            <CardDescription>Student's academic performance (percentage) - Required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAcademics} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="academics_percentage">Percentage (0-100) <span className="text-destructive">*</span></Label>
                  <span className="text-sm font-medium text-foreground">
                    {academicsPercentage === '' ? (academics ? academics.percentage : '0') : academicsPercentage}%
                  </span>
                </div>
                <input
                  id="academics_percentage"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={academicsPercentage === '' ? (academics ? academics.percentage : 0) : academicsPercentage}
                  onChange={(e) => setAcademicsPercentage(parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  required
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
              {academics && (
                <p className="text-sm text-muted-foreground">
                  Current: <strong>{academics.percentage}%</strong>
                </p>
              )}
              <Button type="submit" disabled={submitting || academicsPercentage === ''}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Saving...' : academics ? 'Update Academics' : 'Save Academics'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Values Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>Values <span className="text-destructive">*</span></CardTitle>
            </div>
            <CardDescription>Leadership and Responsibility, Bhavan's Values (1-10 scale) - Required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveValues} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leadership_score">Leadership and Responsibility (1-10) <span className="text-destructive">*</span></Label>
                <Select
                  value={leadershipScore === '' ? '' : leadershipScore.toString()}
                  onValueChange={(value) => setLeadershipScore(value === '' ? '' : parseInt(value))}
                  required
                >
                  <SelectTrigger id="leadership_score">
                    <SelectValue placeholder="Select score" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <SelectItem key={score} value={score.toString()}>
                        {score}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bhavans_score">Bhavan's Values (1-10) <span className="text-destructive">*</span></Label>
                <Select
                  value={bhavansScore === '' ? '' : bhavansScore.toString()}
                  onValueChange={(value) => setBhavansScore(value === '' ? '' : parseInt(value))}
                  required
                >
                  <SelectTrigger id="bhavans_score">
                    <SelectValue placeholder="Select score" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <SelectItem key={score} value={score.toString()}>
                        {score}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {values.length > 0 && (
                <div className="text-sm text-gray-600 space-y-1">
                  {values.map((value) => (
                    <p key={value.id}>
                      {value.value_type}: <strong>{value.score}/10</strong>
                    </p>
                  ))}
                </div>
              )}
              <Button type="submit" disabled={submitting || leadershipScore === '' || bhavansScore === ''}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Saving...' : 'Save Values'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Events Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <CardTitle>Add Event</CardTitle>
            </div>
            <CardDescription>Record a new event for this student</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event_category">Event Category</Label>
                <Select value={eventCategory} onValueChange={(value) => setEventCategory(value as EventCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="achievement_level">Event Level</Label>
                <Select value={achievementLevel} onValueChange={(value) => setAchievementLevel(value as AchievementLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACHIEVEMENT_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_group">Type</Label>
                <Select
                  value={isGroup ? 'group' : 'single'}
                  onValueChange={(value) => setIsGroup(value === 'group')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remark">Remark <span className="text-destructive">*</span></Label>
                <Input
                  id="remark"
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="e.g., Science Fair 2024, Debate Competition"
                  required
                />
                    <p className="text-xs text-muted-foreground">
                  Add a note about which specific event the student registered for
                </p>
              </div>
              <div className="text-sm text-gray-600">
                Points: <strong>{calculatePoints(achievementLevel, isGroup)}</strong> (auto-calculated)
              </div>
              <Button type="submit" disabled={submitting}>
                <Plus className="mr-2 h-4 w-4" />
                {submitting ? 'Adding...' : 'Add Event'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Events ({events.length})</CardTitle>
            </div>
            <CardDescription>All events for this student</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No events yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Event Level</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.event_category}</TableCell>
                      <TableCell>{event.achievement_level}</TableCell>
                      <TableCell>{event.is_group ? 'Group' : 'Single'}</TableCell>
                      <TableCell>{event.points}</TableCell>
                      <TableCell className="max-w-xs truncate" title={event.remark || ''}>
                        {event.remark || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(event.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEvent(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteEventId(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Event Dialog */}
        <Dialog open={editEventId !== null} onOpenChange={() => setEditEventId(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleUpdateEvent}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Edit Event</h2>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_event_category">Event Category</Label>
                  <Select 
                    value={editEventCategory} 
                    onValueChange={(value) => setEditEventCategory(value as EventCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_achievement_level">Event Level</Label>
                  <Select 
                    value={editAchievementLevel} 
                    onValueChange={(value) => setEditAchievementLevel(value as AchievementLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACHIEVEMENT_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_is_group">Type</Label>
                  <Select
                    value={editIsGroup ? 'group' : 'single'}
                    onValueChange={(value) => setEditIsGroup(value === 'group')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-600">
                  Points: <strong>{calculatePoints(editAchievementLevel, editIsGroup)}</strong> (auto-calculated)
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_remark">Remark <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit_remark"
                    type="text"
                    value={editRemark}
                    onChange={(e) => setEditRemark(e.target.value)}
                    placeholder="e.g., Science Fair 2024, Debate Competition"
                    required
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditEventId(null);
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteEventId !== null} onOpenChange={() => setDeleteEventId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this event. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
