# EPIC: Athlete Training Planner

> Blueprint document for RidePro training planning features

## Overview

Transform the workout visualizer into a full training planning platform where coaches can:
- Plan weekly training schedules using a drag & drop calendar
- View athlete availability and goals
- Access an expanded workout library (indoor/outdoor, various durations)

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + TypeScript + Vite | Current stack |
| Styling | Tailwind CSS | Current stack |
| Charts | visx | Workout visualization |
| Drag & Drop | @dnd-kit/core | Calendar interactions |
| Auth | **Clerk** | User authentication, roles (coach/athlete) |
| Database | **Supabase** | Data persistence, real-time sync |
| Hosting | nginx + VPS | Current (ridepro.pixelsmasher.io) |

---

## Feature 1: Weekly Training Calendar

### User Stories

- As a **coach**, I want to drag workouts from the library onto a weekly calendar
- As a **coach**, I want to see the weekly TSS/hours load at a glance
- As a **coach**, I want to navigate between weeks and copy training weeks
- As an **athlete**, I want to view my assigned workouts for the week

### Data Model (Supabase)

```sql
-- Training weeks
CREATE TABLE training_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES profiles(id),
  coach_id UUID REFERENCES profiles(id),
  week_start DATE NOT NULL, -- Always Monday
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, week_start)
);

-- Scheduled workouts within a week
CREATE TABLE scheduled_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_week_id UUID REFERENCES training_weeks(id) ON DELETE CASCADE,
  workout_library_id TEXT NOT NULL, -- Reference to library workout ID
  day_index SMALLINT NOT NULL CHECK (day_index BETWEEN 0 AND 6), -- 0=Mon, 6=Sun
  sort_order SMALLINT DEFAULT 0, -- For multiple workouts per day
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast week lookups
CREATE INDEX idx_scheduled_workouts_week ON scheduled_workouts(training_week_id, day_index);
```

### TypeScript Types

```typescript
interface TrainingWeek {
  id: string;
  athleteId: string;
  coachId: string;
  weekStart: Date; // Monday
  notes?: string;
  days: Record<number, ScheduledWorkout[]>; // 0-6 = Mon-Sun
}

interface ScheduledWorkout {
  id: string;
  workoutLibraryId: string;
  dayIndex: number;
  sortOrder: number;
  notes?: string;
  completed: boolean;
  completedAt?: Date;
  // Denormalized from library for display
  workout?: {
    name: string;
    duration: number;
    tss: number;
    type: string;
  };
}
```

### UI Components

```
src/components/calendar/
├── WeeklyCalendar.tsx      # Main 7-day grid container
├── CalendarDay.tsx         # Single day column with drop zone
├── ScheduledWorkoutCard.tsx # Draggable workout card
├── WorkoutSidebar.tsx      # Library browser sidebar
├── WeekNavigation.tsx      # Prev/next week, date picker
├── WeekSummary.tsx         # Total hours, TSS, workout count
└── DayHeader.tsx           # Day name, date, availability indicator
```

### Calendar Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  < Week of Dec 9, 2024 >                              [Copy Week] [Export]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐   │
│  │   MON   │   TUE   │   WED   │   THU   │   FRI   │   SAT   │   SUN   │   │
│  │  Dec 9  │  Dec 10 │  Dec 11 │  Dec 12 │  Dec 13 │  Dec 14 │  Dec 15 │   │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤   │
│  │ ┌─────┐ │         │ ┌─────┐ │         │ ┌─────┐ │ ┌─────┐ │         │   │
│  │ │VO2  │ │         │ │Sweet│ │         │ │Easy │ │ │Long │ │  REST   │   │
│  │ │4x4  │ │  REST   │ │Spot │ │  REST   │ │Ride │ │ │Ride │ │         │   │
│  │ │1h15 │ │         │ │1h15 │ │         │ │1h   │ │ │3h   │ │         │   │
│  │ │85TSS│ │         │ │75TSS│ │         │ │42TSS│ │ │150TS│ │         │   │
│  │ └─────┘ │         │ └─────┘ │         │ └─────┘ │ └─────┘ │         │   │
│  │         │         │         │         │         │         │         │   │
│  │  [+]    │  [+]    │  [+]    │  [+]    │  [+]    │  [+]    │  [+]    │   │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘   │
│                                                                             │
│  Weekly Summary: 7h 30m │ 352 TSS │ 4 workouts                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Feature 2: Athlete Availability & Goals

### User Stories

- As an **athlete**, I want to set my typical weekly availability so my coach knows when I can train
- As an **athlete**, I want to set my A-race goal with a target date
- As a **coach**, I want to see athlete availability when planning their week

### Data Model (Supabase)

```sql
-- User profiles (extends Clerk user)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('coach', 'athlete')) DEFAULT 'athlete',
  coach_id UUID REFERENCES profiles(id), -- Athletes linked to coach
  ftp INTEGER, -- Functional Threshold Power
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly availability template
CREATE TABLE athlete_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_index SMALLINT NOT NULL CHECK (day_index BETWEEN 0 AND 6),
  available BOOLEAN DEFAULT TRUE,
  time_slots TEXT[], -- ['morning', 'afternoon', 'evening']
  max_hours DECIMAL(3,1), -- e.g., 2.5 hours
  notes TEXT,
  UNIQUE(athlete_id, day_index)
);

-- Training goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date DATE,
  priority CHAR(1) CHECK (priority IN ('A', 'B', 'C')) DEFAULT 'B',
  event_type TEXT, -- 'Gran Fondo', 'Criterium', 'Time Trial', etc.
  target_duration TEXT, -- '4 hours', '40km', etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Types

```typescript
interface AthleteProfile {
  id: string;
  clerkUserId: string;
  email: string;
  fullName: string;
  role: 'coach' | 'athlete';
  coachId?: string;
  ftp?: number;
}

interface WeeklyAvailability {
  [dayIndex: number]: {
    available: boolean;
    timeSlots: ('morning' | 'afternoon' | 'evening')[];
    maxHours?: number;
    notes?: string;
  };
}

interface Goal {
  id: string;
  athleteId: string;
  name: string;
  eventDate?: Date;
  priority: 'A' | 'B' | 'C';
  eventType?: string;
  targetDuration?: string;
  notes?: string;
}
```

### UI Components

```
src/components/athlete/
├── AvailabilityEditor.tsx   # Weekly availability grid
├── TimeSlotPicker.tsx       # Morning/afternoon/evening toggles
├── GoalsList.tsx            # List of goals with priority badges
├── GoalForm.tsx             # Add/edit goal modal
└── AthleteProfileCard.tsx   # Summary card with FTP, goals, availability
```

### Availability UI

```
┌─────────────────────────────────────────────────────────────────┐
│  My Weekly Availability                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│      MON    TUE    WED    THU    FRI    SAT    SUN              │
│  ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┐     │
│  │  [x]  │  [ ]  │  [x]  │  [ ]  │  [x]  │  [x]  │  [ ]  │     │
│  ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤     │
│  │ 🌅 AM │   -   │ 🌅 AM │   -   │ 🌅 AM │ 🌅 AM │   -   │     │
│  │ 🌆 PM │       │ 🌆 PM │       │       │ 🌆 PM │       │     │
│  │       │       │       │       │       │ 🌙 EV │       │     │
│  ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤     │
│  │ 1.5h  │   -   │ 1.5h  │   -   │  1h   │  3h   │   -   │     │
│  └───────┴───────┴───────┴───────┴───────┴───────┴───────┘     │
│                                                                 │
│  Weekly capacity: ~8 hours                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  My Goals                                            [+ Add]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🅰️  Nove Colli Gran Fondo           June 15, 2025   200km     │
│      Target: Complete in under 8 hours                          │
│                                                                 │
│  🅱️  Club Time Trial                  April 5, 2025   40km      │
│      Target: Sub 60 minutes                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature 3: Library Expansion

### Current State

- 83 workouts across 12 categories
- Duration: 1-2 hours
- No indoor/outdoor distinction

### Expansion Needed

| Type | Duration | Examples |
|------|----------|----------|
| Indoor | < 1h | Trainer intervals, lunch rides, morning openers |
| Standard | 1-2h | Current library |
| Outdoor | > 2h | Long rides, endurance builds, event simulation |

### Data Changes

Add metadata to workout library:

```typescript
interface WorkoutLibraryItem {
  id: string;
  name: string;
  workout: Workout;
  // New fields
  tags: {
    duration: 'short' | 'medium' | 'long'; // <1h, 1-2h, >2h
    environment: 'indoor' | 'outdoor' | 'any';
    intensity: 'easy' | 'moderate' | 'hard';
  };
}
```

### Library Filters UI

```
┌────────────────────────────────────┐
│  Workout Library          [Search] │
├────────────────────────────────────┤
│  Duration:  [<1h] [1-2h] [>2h]     │
│  Type:      [Indoor] [Outdoor]     │
│  Category:  [All ▼]                │
├────────────────────────────────────┤
│  📁 Anaerobic Capacity (6)         │
│  📁 VO2 Max (9)                    │
│  📁 Sweet Spot (12)                │
│  📁 Endurance - Long (NEW)         │
│  ...                               │
└────────────────────────────────────┘
```

### Process for Adding Workouts

1. Client provides workout data in existing format:
   ```
   CATEGORY: Endurance Long
   name: 3h Zone 2 Build
   json: {...}
   ```

2. Run parser script:
   ```bash
   node scripts/parseLibraryData.js
   ```

3. Rebuild and deploy

---

## Authentication Flow (Clerk + Supabase)

### User Roles

| Role | Permissions |
|------|-------------|
| **Coach** | Create/edit training plans, view all athletes, manage library |
| **Athlete** | View own plan, set availability, mark workouts complete |

### Auth Integration

```typescript
// Clerk webhook syncs users to Supabase profiles
// src/lib/auth.ts

import { useUser } from '@clerk/clerk-react';
import { supabase } from './supabase';

export const useProfile = () => {
  const { user } = useUser();

  // Fetch Supabase profile linked to Clerk user
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', user?.id)
      .single()
  });

  return profile;
};
```

### Route Protection

```typescript
// Coach-only routes
/calendar          // Weekly planner (coach view)
/athletes          // Athlete list
/library/manage    // Add/edit workouts

// Athlete routes
/my-plan           // View assigned workouts
/availability      // Set availability
/goals             // Manage goals

// Shared routes
/workout/:id       // Workout detail/visualizer
```

---

## Implementation Phases

### Phase 1: Library Expansion (Quick Win)
- [ ] Add duration/environment tags to parser script
- [ ] Add filter UI to WorkoutLibrary component
- [ ] Client provides new workout data
- [ ] Regenerate and deploy

**Estimate**: Small

### Phase 2: Calendar MVP (Core Feature)
- [ ] Set up @dnd-kit
- [ ] Create calendar grid components
- [ ] Implement drag & drop from sidebar
- [ ] Local storage persistence
- [ ] Week navigation

**Estimate**: Medium

### Phase 3: Supabase Integration
- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Migrate from local storage to Supabase
- [ ] Real-time sync for calendar updates

**Estimate**: Medium

### Phase 4: Clerk Auth
- [ ] Set up Clerk project
- [ ] Implement sign in/sign up
- [ ] Webhook to sync users to Supabase
- [ ] Role-based route protection

**Estimate**: Medium

### Phase 5: Athlete Availability
- [ ] Availability editor component
- [ ] Goals management
- [ ] Display availability overlay on calendar

**Estimate**: Small-Medium

### Phase 6: Polish & Features
- [ ] Copy week functionality
- [ ] Export to PDF
- [ ] Mobile responsive calendar
- [ ] Workout completion tracking
- [ ] Weekly TSS/load charts

**Estimate**: Ongoing

---

## Environment Variables Needed

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx # Server-side only
```

---

## Open Questions

1. **Multi-athlete support**: Can a coach manage multiple athletes from day one?
2. **Workout customization**: Can coach modify placed workouts (adjust duration/intensity)?
3. **Notifications**: Email/push when plan is updated?
4. **Mobile app**: Future consideration for native app?
5. **Integrations**: Sync with Garmin/Wahoo/Strava?

---

## File Structure (Proposed)

```
src/
├── components/
│   ├── calendar/           # Weekly calendar components
│   ├── athlete/            # Availability, goals, profile
│   ├── library/            # Workout library browser
│   └── workout/            # Workout visualization (existing)
├── hooks/
│   ├── useCalendar.ts      # Calendar state management
│   ├── useProfile.ts       # User profile + availability
│   └── useWorkouts.ts      # Library queries
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── auth.ts             # Clerk integration
│   └── dnd.ts              # Drag & drop utilities
├── pages/
│   ├── Calendar.tsx        # Weekly planner page
│   ├── Athletes.tsx        # Athlete list (coach)
│   ├── Availability.tsx    # Availability settings
│   └── Workout.tsx         # Single workout view
└── types/
    ├── calendar.ts         # Calendar types
    ├── athlete.ts          # Profile, availability, goals
    └── workout.ts          # Existing workout types
```

---

*Document created: December 6, 2024*
*Last updated: December 6, 2024*
