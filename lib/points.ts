export type AchievementLevel =
  | 'National Winner'
  | 'National Participation'
  | 'State Winner'
  | 'State Participation'
  | 'District Winners'
  | 'District Participation'
  | 'Interschool Ekm District Winners'
  | 'Interschool Ekm District Participation'
  | 'Mayookham Winners';

export type EventCategory =
  | 'Literary'
  | 'Sports'
  | 'Arts'
  | 'Science/Maths';

export const ACHIEVEMENT_LEVELS: AchievementLevel[] = [
  'National Winner',
  'National Participation',
  'State Winner',
  'State Participation',
  'District Winners',
  'District Participation',
  'Interschool Ekm District Winners',
  'Interschool Ekm District Participation',
  'Mayookham Winners',
];

export const EVENT_CATEGORIES: EventCategory[] = [
  'Literary',
  'Sports',
  'Arts',
  'Science/Maths',
];

export const ACHIEVEMENT_POINTS: Record<AchievementLevel, { single: number; group: number }> = {
  'National Winner': { single: 30, group: 27 },
  'National Participation': { single: 25, group: 23 },
  'State Winner': { single: 20, group: 17 },
  'State Participation': { single: 15, group: 13 },
  'District Winners': { single: 12, group: 11 },
  'District Participation': { single: 10, group: 9 },
  'Interschool Ekm District Winners': { single: 8, group: 7 },
  'Interschool Ekm District Participation': { single: 5, group: 4 },
  'Mayookham Winners': { single: 3, group: 2 },
};

export function calculatePoints(achievementLevel: AchievementLevel, isGroup: boolean): number {
  const points = ACHIEVEMENT_POINTS[achievementLevel];
  return isGroup ? points.group : points.single;
}
