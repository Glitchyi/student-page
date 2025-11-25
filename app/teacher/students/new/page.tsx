'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ACHIEVEMENT_LEVELS, AchievementLevel, EVENT_CATEGORIES, EventCategory, calculatePoints } from '@/lib/points';
import { Plus, Trash2, Home, ArrowLeft, User, GraduationCap, Award, Trophy, BookOpen, Users, Target } from 'lucide-react';
import { DarkModeToggle } from '@/components/dark-mode-toggle';

interface EventForm {
  event_category: EventCategory;
  achievement_level: AchievementLevel;
  is_group: boolean;
  remark: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [academicsPercentage, setAcademicsPercentage] = useState<number | ''>('');
  const [leadershipScore, setLeadershipScore] = useState<number | ''>('');
  const [bhavansScore, setBhavansScore] = useState<number | ''>('');
  const [events, setEvents] = useState<EventForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

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

  const addEvent = () => {
    setEvents([...events, {
      event_category: 'Literary',
      achievement_level: 'National Winner',
      is_group: false,
      remark: '',
    }]);
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const updateEvent = (index: number, field: keyof EventForm, value: any) => {
    const updated = [...events];
    updated[index] = { ...updated[index], [field]: value };
    setEvents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (academicsPercentage === '') {
        setError('Academics percentage is required');
        setLoading(false);
        return;
      }

      if (leadershipScore === '' || bhavansScore === '') {
        setError('Both Leadership and Responsibility and Bhavan\'s Values scores are required');
        setLoading(false);
        return;
      }

      // Format data for API
      const payload: any = {
        name,
        academics: { percentage: academicsPercentage },
        values: [
          { value_type: 'Leadership and Responsibility', score: leadershipScore },
          { value_type: "Bhavan's Values", score: bhavansScore },
        ],
      };

      // Format events for API
      const formattedEvents = events
        .filter(event => event.remark.trim() !== '')
        .map(event => ({
          event_category: event.event_category,
          achievement_level: event.achievement_level,
          is_group: event.is_group,
          remark: event.remark.trim(),
        }));

      if (formattedEvents.length > 0) {
        payload.events = formattedEvents;
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create student');
        setLoading(false);
        return;
      }

      router.push('/teacher/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-4">
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Add New Student</CardTitle>
            </div>
            <CardDescription>Enter the student's information and events</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter student name"
                />
              </div>

              {/* Academics Section */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Academics <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">Student's academic performance percentage</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="academics_percentage">Percentage (0-100) <span className="text-destructive">*</span></Label>
                    <span className="text-sm font-medium text-foreground">
                      {academicsPercentage === '' ? '0' : academicsPercentage}%
                    </span>
                  </div>
                  <input
                    id="academics_percentage"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={academicsPercentage === '' ? 0 : academicsPercentage}
                    onChange={(e) => setAcademicsPercentage(parseFloat(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    required
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Values Section */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Values <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">Leadership and Responsibility, Bhavan's Values (1-10 scale)</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Events Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Events (Optional)
                    </Label>
                    <p className="text-sm text-muted-foreground">Add events for this student</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEvent}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </div>

                {events.length > 0 && (
                  <div className="space-y-3 border rounded-lg p-4">
                    {events.map((event, index) => (
                      <div key={index} className="space-y-3 p-3 bg-muted/50 rounded border">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">Event {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEvent(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`event_category_${index}`}>Event Category</Label>
                            <Select
                              value={event.event_category}
                              onValueChange={(value) => updateEvent(index, 'event_category', value)}
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
                            <Label htmlFor={`achievement_level_${index}`}>Event Level</Label>
                            <Select
                              value={event.achievement_level}
                              onValueChange={(value) => updateEvent(index, 'achievement_level', value)}
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
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`is_group_${index}`}>Type</Label>
                          <Select
                            value={event.is_group ? 'group' : 'single'}
                            onValueChange={(value) => updateEvent(index, 'is_group', value === 'group')}
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

                        <div className="text-sm text-muted-foreground">
                          Points: <strong>{calculatePoints(event.achievement_level, event.is_group)}</strong> (auto-calculated)
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`remark_${index}`}>Remark <span className="text-destructive">*</span></Label>
                          <Input
                            id={`remark_${index}`}
                            type="text"
                            value={event.remark}
                            onChange={(e) => updateEvent(index, 'remark', e.target.value)}
                            placeholder="e.g., Science Fair 2024, Debate Competition"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Add a note about which specific event the student registered for
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No events added. You can add events now or add them later from the student's detail page.
                  </p>
                )}
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Student'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/teacher/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
