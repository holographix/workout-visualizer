# RidePro Features & User Journeys

This document outlines all implemented features, their business logic, and user journeys for e2e testing.

## Table of Contents

1. [User Roles](#user-roles)
2. [Authentication](#authentication)
3. [Onboarding](#onboarding)
4. [Assessment Tests](#assessment-tests)
5. [Training Zones](#training-zones)
6. [Coach Features](#coach-features)
7. [Athlete Features](#athlete-features)
8. [Workout Builder](#workout-builder)
9. [Calendar System](#calendar-system)
10. [Settings & Availability](#settings--availability)
11. [Guided Tour & Setup Checklist](#guided-tour--setup-checklist)
12. [User Journeys for E2E Testing](#user-journeys-for-e2e-testing)
13. [Future Features / Roadmap](#future-features--roadmap)
    - [CRITICAL: Auto Plan Generation Engine](#1-auto-plan-generation-engine)
    - [IMPLEMENTED: Zone Calculation System](#2-zone-calculation-system-implemented)
    - [CRITICAL: Third-Party Integrations (Strava/Garmin/Wahoo)](#3-third-party-integrations)
    - [CRITICAL: AI Chat Assistant](#4-ai-chat-assistant)
    - [HIGH: Extended Performance Data](#5-extended-performance-data)
    - [HIGH: Experience Level in Onboarding](#6-experience-level-in-onboarding)
    - [HIGH: Coach Selection / Marketplace](#7-coach-selection--marketplace)
    - [HIGH: Payment Integration (Stripe)](#8-payment-integration-stripe)
    - [MEDIUM: Advanced Analytics Dashboard](#10-advanced-analytics-dashboard)
    - [MEDIUM: Adaptive Plan Modifications](#11-adaptive-plan-modifications)
    - [MEDIUM: Macro-Objectives for Non-Racers](#12-macro-objectives-for-non-racers)
    - [MEDIUM: Fixed vs Flexible Days](#13-fixed-vs-flexible-days-preference)

---

## User Roles

### Coach
- Can create and manage workouts
- Can view and manage athletes
- Can schedule workouts on athlete calendars
- Can invite new athletes via email
- Has access to the Coach dashboard

### Athlete
- Can view their training calendar
- Can mark workouts as complete
- Can set availability and training goals
- Can access workouts assigned by their coach

---

## Authentication

### Business Logic
- Uses Clerk for authentication
- User roles stored in database (Coach/Athlete)
- Coach-athlete relationships managed via `coachId` foreign key
- Athletes can only see their own data
- Coaches can see data for all their athletes

### Routes
| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Redirects to `/dashboard` |
| `/dashboard` | Authenticated | Role-based dashboard (CoachDashboardPage or AthleteDashboardPage) |
| `/calendar` | Authenticated | Athlete training calendar view |
| `/coach` | Coach only | Coach athlete management & workouts |
| `/workout/:id` | Coach only | Workout builder/editor |
| `/settings` | Authenticated | User settings & availability |
| `/athlete/:athleteId/calendar` | Coach only | Assign workouts to specific athlete |
| `/athlete/:athleteId/stats` | Coach only | View athlete statistics |
| `/invite/:token` | Public | Invitation acceptance page |
| `/onboarding` | New Athletes | 7-step onboarding wizard |

---

## Onboarding

### Overview

New athletes must complete a 7-step onboarding wizard before accessing the main platform. The wizard collects essential profile data needed by coaches to create personalized training plans.

### Route

`/onboarding` - Protected route, redirects to dashboard if already completed.

### Onboarding Steps

| Step | Screen | Fields |
|------|--------|--------|
| 1 | Personal Info | First Name, Last Name, Birthday, Sex, Last Menstrual Date (if female) |
| 2 | Physical Data | Height (cm), Weight (kg) |
| 3 | Category | Athlete Category (Amatore, Juniores, U23, Elite, Pro) |
| 4 | Discipline | Primary discipline (MTB/Gravel/Road) with sub-type selection |
| 5 | Terrain | Preferred terrain (Hills 10-15', Flat, Mountains 1h+) |
| 6 | Availability | Weekly availability (reuses WeeklyAvailabilityEditor) |
| 7 | Activities & Equipment | Activity types (multi-select), Power meter checkbox, HR monitor checkbox |

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| OnboardingWizard | `components/organisms/Onboarding/OnboardingWizard.tsx` | Container with progress stepper |
| StepPersonalInfo | `components/organisms/Onboarding/StepPersonalInfo.tsx` | Step 1 form |
| StepPhysical | `components/organisms/Onboarding/StepPhysical.tsx` | Step 2 form |
| StepCategory | `components/organisms/Onboarding/StepCategory.tsx` | Step 3 selection |
| StepDiscipline | `components/organisms/Onboarding/StepDiscipline.tsx` | Step 4 selection |
| StepTerrain | `components/organisms/Onboarding/StepTerrain.tsx` | Step 5 selection |
| StepAvailability | `components/organisms/Onboarding/StepAvailability.tsx` | Step 6 editor |
| StepActivities | `components/organisms/Onboarding/StepActivities.tsx` | Step 7 multi-select |

### Business Logic

- **OnboardingGuard**: Wraps protected routes, redirects to `/onboarding` if `onboardingCompleted === false`
- **Step Persistence**: Each step saves data to API before advancing
- **Back Navigation**: Users can go back to previous steps to edit
- **Completion**: Final step marks `onboardingCompleted = true` in database
- **Post-completion**: Triggers guided tour and setup checklist

### Data Models

```typescript
enum Sex { MALE, FEMALE }
enum AthleteCategory { AMATORE, JUNIORES, U23, ELITE, PRO }
enum TerrainType { HILLS, FLAT, MOUNTAINS }
enum DisciplineType { MTB, GRAVEL_CICLOCROSS, ROAD }
enum DisciplineSubType {
  MTB_XC_90MIN, MTB_GF_MARATHON_3H, MTB_NO_RACE,
  GRAVEL_RACE_1H, GRAVEL_RACE_2H, GRAVEL_ULTRA_6H, GRAVEL_NO_RACE,
  ROAD_CIRCUITS_1H, ROAD_GRAN_FONDO_2H, ROAD_ULTRA_6H, ROAD_NO_RACE
}
enum ActivityType {
  OUTDOOR_CYCLING, INDOOR_CYCLING, WORKOUT_HOME, WORKOUT_GYM,
  CROSS_RUNNING, CROSS_SWIMMING, CROSS_SKIING
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/onboarding/:athleteId/status` | Get onboarding status & current step |
| POST | `/api/onboarding/:athleteId/step/:stepNumber` | Save step data |
| POST | `/api/onboarding/:athleteId/complete` | Mark onboarding as complete |
| GET | `/api/onboarding/:athleteId/profile` | Get full athlete profile (coach view) |

---

## Assessment Tests

### Overview

Athletes take fitness assessment tests to provide their coach with baseline power and heart rate data. Tests should be repeated monthly for ongoing training optimization.

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| AssessmentCard | `components/organisms/Assessment/AssessmentCard.tsx` | Dashboard card with reminder |
| AssessmentModal | `components/organisms/Assessment/AssessmentModal.tsx` | Modal for test entry |
| AssessmentProtocolSelector | `components/organisms/Assessment/AssessmentProtocolSelector.tsx` | Protocol selection |
| Sprint12Form | `components/organisms/Assessment/Sprint12Form.tsx` | Sprint + 12min form |
| Power125Form | `components/organisms/Assessment/Power125Form.tsx` | 1/2/5min efforts form |
| AssessmentResults | `components/organisms/Assessment/AssessmentResults.tsx` | Results display |

### Assessment Protocols

#### Protocol 1: Sprint + 12min Climb

| Metric | Type | Description |
|--------|------|-------------|
| Sprint Peak Power | **PEAK** | Maximum power during 15" sprint |
| Sprint Max HR | MAX | Highest HR during sprint |
| 12' Climb Avg Power | **AVERAGE** | Mean power over 12 minutes |
| 12' Climb Max HR | MAX | Highest HR during climb |

#### Protocol 2: 1/2/5 Minute Efforts

| Metric | Type | Description |
|--------|------|-------------|
| 1' Avg Power | **AVERAGE** | Mean power over 1 minute |
| 1' Max HR | MAX | Highest HR during effort |
| 2' Avg Power | **AVERAGE** | Mean power over 2 minutes |
| 2' Max HR | MAX | Highest HR during effort |
| 5' Avg Power | **AVERAGE** | Mean power over 5 minutes |
| 5' Max HR | MAX | Highest HR during effort |

### Monthly Reminder

The AssessmentCard displays a reminder when:
- **First Test**: Athlete has never taken an assessment (shows "Complete your first assessment")
- **Monthly Overdue**: Last test was more than 30 days ago (shows "Time for your monthly assessment")

### Business Logic

- Athletes self-service: Start assessment from dashboard
- Manual data entry (Phase 1), file upload (Phase 2)
- Results used by coach to calculate training zones
- Estimated FTP computed from test results
- Historical assessments viewable for progress tracking

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments/:athleteId` | Get all athlete assessments |
| GET | `/api/assessments/:athleteId/latest` | Get latest assessment |
| POST | `/api/assessments` | Create assessment result |
| PUT | `/api/assessments/:id` | Update assessment |
| DELETE | `/api/assessments/:id` | Delete assessment |

### Data Model

```typescript
interface Assessment {
  id: string;
  athleteId: string;
  testType: 'SPRINT_12MIN' | 'POWER_1_2_5MIN';
  testDate: Date;

  // Sprint + 12min protocol
  sprintPeakPower?: number;
  sprintMaxHR?: number;
  climb12AvgPower?: number;
  climb12MaxHR?: number;

  // Power 1/2/5min protocol
  effort1minAvgPower?: number;
  effort1minMaxHR?: number;
  effort2minAvgPower?: number;
  effort2minMaxHR?: number;
  effort5minAvgPower?: number;
  effort5minMaxHR?: number;

  estimatedFTP?: number;
  notes?: string;
}
```

---

## Training Zones

### Overview

Training zones provide personalized power and heart rate targets for athletes based on their assessment test results. Coaches can view athlete zones on the stats page to inform training prescription.

### Zone Calculation (Coach's Formula)

Based on the coach's "Calcolo zone.xlsx" spreadsheet:

**FC Soglia (Threshold HR)** = 93% of Max HR

#### Power Zones (6 zones, % of FTP)

| Zone | Name | Italian | % FTP |
|------|------|---------|-------|
| Z1 | Active Recovery | Recupero Attivo | 0-55% |
| Z2 | Endurance | Resistenza | 55-75% |
| Z3 | Tempo | Tempo (Medio) | 75-90% |
| Z4 | Lactate Threshold | Soglia Lattacida | 90-105% |
| Z5 | VO2Max | VO2MAX | 105-120% |
| Z6 | Anaerobic Capacity | Capacità Anaerobica | 120-150% |

#### HR Zones (5 zones, % of FC Soglia)

| Zone | Name | Italian | % FC Soglia |
|------|------|---------|-------------|
| Z1 | Active Recovery | Recupero Attivo | <68% |
| Z2 | Endurance | Resistenza | 68-83% |
| Z3 | Tempo | Tempo (Medio) | 83-94% |
| Z4 | Lactate Threshold | Soglia Lattacida | 94-105% |
| Z5 | VO2Max | VO2MAX | 105-120% |

### Zone Systems

**Power Zone Systems:**
- `COGGAN` (default) - Standard 6-zone Coggan model
- `POLARIZED` - 3-zone polarized training
- `CUSTOM` - Custom zone boundaries

**HR Zone Systems:**
- `STANDARD` (default) - Standard 5-zone model based on FC Soglia
- `KARVONEN` - Karvonen formula using heart rate reserve
- `CUSTOM` - Custom zone boundaries

### Auto-Update from Assessments

When an athlete completes an assessment test:
1. **FTP** is automatically updated from the estimated FTP (95% of 12' climb power or 90% of 5' power)
2. **Max HR** is automatically updated if the test result is higher than the current value
3. Power and HR zones are automatically recalculated based on new values

### Display Location

Training zones are displayed on the **AthleteStatsPage** (`/athlete/:athleteId/stats`) for coach view:
- Power Zones table with zone name, watt range, and %FTP
- HR Zones table with zone name, BPM range, and %FC Soglia
- FTP badge showing current FTP value
- Max HR badge showing current Max HR value
- Empty state messaging when FTP or Max HR is not set

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/zones/:athleteId` | Get all zones (power + HR) with calculated values |
| GET | `/api/zones/:athleteId/power` | Get power zones configuration |
| PUT | `/api/zones/:athleteId/power` | Update power zones |
| GET | `/api/zones/:athleteId/hr` | Get HR zones configuration |
| PUT | `/api/zones/:athleteId/hr` | Update HR zones |
| PUT | `/api/zones/:athleteId/data` | Update athlete's FTP, maxHR, restingHR |
| POST | `/api/zones/calculate/power` | Calculate power zones from FTP (without saving) |
| POST | `/api/zones/calculate/hr` | Calculate HR zones from maxHR (without saving) |

### Data Models

```typescript
interface PowerZoneConfig {
  id?: string;
  athleteId: string;
  zoneSystem: 'COGGAN' | 'POLARIZED' | 'CUSTOM';
  zone1Max: number;  // Default: 55
  zone2Max: number;  // Default: 75
  zone3Max: number;  // Default: 90
  zone4Max: number;  // Default: 105
  zone5Max: number;  // Default: 120
  zone6Max: number;  // Default: 150
}

interface HRZoneConfig {
  id?: string;
  athleteId: string;
  zoneSystem: 'STANDARD' | 'KARVONEN' | 'CUSTOM';
  zone1Max: number;  // Default: 68
  zone2Max: number;  // Default: 83
  zone3Max: number;  // Default: 94
  zone4Max: number;  // Default: 105
  zone5Max: number;  // Default: 120
}

interface CalculatedPowerZone {
  zone: number;
  name: string;
  minWatts: number;
  maxWatts: number | null;
  minPercent: number;
  maxPercent: number | null;
}

interface CalculatedHRZone {
  zone: number;
  name: string;
  minBPM: number;
  maxBPM: number | null;
  minPercent: number;
  maxPercent: number | null;
}
```

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| AthleteStatsPage | `pages/AthleteStatsPage.tsx` | Coach view with zones display |
| useZones | `hooks/useZones.ts` | Hook for fetching and updating zones |

---

## Coach Features

### Coach Dashboard Overview (`/dashboard` for coaches)

**Features:**
- Overview stats cards: Total Athletes, Overall Compliance, Workouts Completed/Planned, TSS Completed/Planned
- Athletes needing attention section (highlighted with warning)
- All athletes weekly progress table with clickable rows
- Upcoming goals sidebar across all athletes
- Quick actions panel for navigation
- Week-based view showing current week's aggregated data

**Business Logic (Backend - `calendar.service.ts`):**
- Fetches all active athlete relationships for the coach
- For each athlete, calculates for the current week:
  - Workouts planned vs completed
  - Compliance % = (completed / planned) * 100
  - Planned TSS from all scheduled workouts
  - Completed TSS (uses actual if available, otherwise planned)
  - Planned hours = sum(durationSeconds / 3600)
  - Completed hours (uses actual duration if available)
  - Missed workouts = past days with incomplete workouts
- Athletes needing attention criteria:
  - Has missed workouts > 0 OR
  - Compliance < 50% (and has workouts planned)
- Overall compliance = average of all athletes' compliance
- Upcoming goals: next 10 goals across all athletes sorted by eventDate

**Business Logic (Frontend - `CoachDashboardPage.tsx`):**
- Uses `useCoachDashboardAPI` hook with coachId and current weekStart
- Displays loading spinner during initial fetch
- Color-coded compliance indicators:
  - Green: >= 80%
  - Orange: 50-79%
  - Red: < 50%
- Clicking athlete row navigates to `/athlete/:athleteId/calendar`
- Clicking goal navigates to athlete's calendar

**UI States:**
- Loading: Full-page spinner
- Empty (no athletes): Shows "No athletes found" message
- Populated: Stats grid, attention cards, progress table, goals sidebar

**API Endpoint:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/coach/:coachId/dashboard?weekStart=` | Get aggregated coach dashboard data |

**Response Types:**
```typescript
interface CoachDashboardResponse {
  overview: {
    totalAthletes: number;
    totalWorkoutsPlanned: number;
    totalWorkoutsCompleted: number;
    overallCompliance: number;
    totalTSSPlanned: number;
    totalTSSCompleted: number;
  };
  athleteProgress: AthleteProgress[];
  athletesNeedingAttention: AthleteProgress[];
  upcomingGoals: CoachDashboardGoal[];
}
```

---

### Coach Management Page (`/coach`)

#### Athletes Tab
**Features:**
- View list of all coached athletes
- Card view or list view toggle
- Search athletes by name
- View athlete status (Active, Inactive, New)
- Quick actions: View calendar, View stats, Contact

**Business Logic:**
- Fetches athletes via `GET /api/athletes?coachId={coachId}`
- Athletes sorted by name
- Status determined by recent activity

**UI States:**
- Loading: Skeleton cards (3 placeholders)
- Empty: "No athletes yet. Invite athletes to start coaching."
- Populated: Grid/list of athlete cards

#### My Workouts Tab
**Features:**
- View list of coach-created workouts
- Create new workout
- Edit existing workout
- View workout details (read-only modal with chart preview)
- Delete workout with confirmation
- Search workouts by name
- Filter by category

**Business Logic:**
- Fetches workouts via `GET /api/workouts?coachId={coachId}`
- View opens read-only modal with workout metrics and chart
- Delete requires confirmation modal
- Delete via `DELETE /api/workouts/{id}`

**UI States:**
- Loading: Skeleton list items (3 placeholders)
- Empty: "Create your first workout" with CTA button
- Populated: List of workout items with actions

### Invite Athlete
**Features:**
- Email input (required)
- Name input (optional)
- Personal message (optional)
- Send invitation

**Business Logic:**
- Creates invitation record via `POST /api/invitations`
- Sends email with unique token link
- Token expires after configured period
- Pending invitations shown in list

---

## Athlete Features

### Training Calendar (`/calendar`)

**Features:**
- Week-based calendar view (Mon-Sun) with week navigation
- Month-based calendar view with week summaries
- Week/Month toggle switch in header
- Navigate between weeks/months
- View scheduled workouts per day
- Drag workouts from library to calendar (desktop)
- Tap-to-select workflow (mobile)
- Mark workouts as complete
- Visual distinction for completed workouts
- Unavailable days shown with overlay
- Capacity load bars showing allocated vs max hours per day
- Skeleton loaders during week/month data fetch
- Slide animations when navigating between weeks

**Weekly View:**
- 7-day grid with day headers and date numbers
- Drag-drop zones for each day
- Workout cards with remove/complete actions
- Capacity progress bar per day (green/yellow/orange/red)

**Monthly View:**
- Month overview with all weeks displayed as rows
- Click any week row to drill down to weekly view
- Workout dots (up to 3) indicate workouts per day
- Weekly summaries: workout count, TSS, hours
- Week number labels (W1, W2, etc.)

**Business Logic:**
- Weekly: Fetches via `GET /api/calendar/week/{athleteId}?weekStart={date}`
- Monthly: Fetches multiple weeks via `useCalendarMonthAPI` hook
- Week auto-created on first workout add
- Respects athlete availability settings
- Blocks scheduling on days at capacity (maxHours reached)
- Debounced API fetching (300ms) prevents rapid calls during navigation

**UI States:**
- Loading: Skeleton workout cards in each day column
- Fetching: Skeleton loaders while navigating weeks
- Empty day: Dashed border with "Drop here" / "Tap to add" hint
- Populated day: Stacked workout cards
- Unavailable day: Grayed out with "Unavailable" label
- Full day: Progress bar red, drops blocked

### Workout Library Panel
**Features:**
- System library (global workouts)
- My library (coach-created workouts)
- Search functionality
- Category filter
- View workout details (read-only modal)
- Drag-to-calendar on desktop
- Tap-to-select on mobile

**Business Logic:**
- System workouts: `GET /api/workouts` (no coachId)
- Coach workouts: `GET /api/workouts?coachId={coachId}`
- Categories: `GET /api/workouts/categories`
- Click on system workout or eye icon shows read-only modal with workout preview

### Workout Viewer Modal

**Features:**
- View workout structure and visualization
- Log/edit workout results (athletes)
- View athlete workout reports (coaches)
- Tabbed interface: Structure | Report

**Components:**

| Component | Location | Description |
|-----------|----------|-------------|
| WorkoutViewerModal | `components/organisms/Calendar/WorkoutViewerModal.tsx` | Main modal with tabs |

**Structure Tab:**
- Workout chart visualization using `WorkoutChart` component
- Interval list using `IntervalList` component
- Workout duration and metrics display

**Report Tab (Athlete View):**
- Editable form for logging results
- Fields: Actual Duration, Distance, Avg Power, Avg HR, RPE, Feeling, Notes
- Save button to submit/update results

**Report Tab (Coach View):**
- Read-only view of athlete's submitted results
- Shows completion status message if not completed
- Displays all result fields when completed

**Business Logic:**
- Fetches scheduled workout details via `GET /api/calendar/scheduled/:id`
- Athletes can log and edit their workout results
- Coaches see read-only report view
- Results saved via `PUT /api/calendar/scheduled/:id/complete`

**Data Model (WorkoutResults):**
```typescript
interface WorkoutResults {
  actualDurationSeconds?: number;
  distance?: number;
  avgPower?: number;
  avgHeartRate?: number;
  rpe?: number;
  feeling?: 'GREAT' | 'GOOD' | 'OK' | 'TIRED' | 'EXHAUSTED';
  resultNotes?: string;
}
```

---

## Workout Builder

### Create/Edit Workout (`/workout/:id` or `/workout/new`)

**Features:**
- Workout title (required)
- Workout type selection
- Category selection
- Category creation inline
- Description (optional)
- Workout structure builder
- Step types: Warm Up, Active, Rest, Cool Down, Interval Block
- Duration per step
- Power zone per step
- Interval block with repetitions
- Live preview chart
- Estimated metrics (TSS, IF, Duration)

**Business Logic:**
- Create: `POST /api/workouts`
- Update: `PUT /api/workouts/{id}`
- Validates required fields
- Calculates metrics from structure
- Categories: `GET /api/workouts/categories`
- Create category: `POST /api/workouts/categories`

**Workout Types:**
```typescript
type WorkoutType =
  | 'outdoorCycling'
  | 'indoorCycling'
  | 'gymHome'
  | 'gymFacility'
  | 'crossTraining'
  | 'other';
```

**Step Types:**
```typescript
type StepType =
  | 'warmUp'
  | 'active'
  | 'rest'
  | 'coolDown'
  | 'repetition';
```

### Workout Structure Format
```json
{
  "structure": [
    {
      "type": "warmUp",
      "length": { "value": 10, "unit": "minute" },
      "name": "Warm Up",
      "targets": [{ "type": "zone", "value": 2 }]
    },
    {
      "type": "repetition",
      "numberOfIterations": 5,
      "steps": [
        {
          "type": "active",
          "length": { "value": 5, "unit": "minute" },
          "name": "Interval",
          "targets": [{ "type": "zone", "value": 5 }]
        },
        {
          "type": "rest",
          "length": { "value": 3, "unit": "minute" },
          "name": "Recovery"
        }
      ]
    }
  ]
}
```

---

## Calendar System

### Training Week
**Data Model:**
```typescript
interface TrainingWeek {
  id: string;
  weekStart: string; // ISO date, always Monday
  athleteId: string;
  notes: string | null;
  scheduledWorkouts: ScheduledWorkout[];
}
```

### Scheduled Workout
**Data Model:**
```typescript
interface ScheduledWorkout {
  id: string;
  workoutId: string;
  dayIndex: number; // 0-6 (Mon-Sun)
  sortOrder: number;
  completed: boolean;
  completedAt: string | null;
  notes: string | null;
  // Workout structure overrides (Feature 3: Edit Scheduled Workout Duration)
  structureOverride?: any; // Modified workout structure
  durationOverride?: number; // Modified duration in seconds
  tssOverride?: number; // Recalculated TSS
  ifOverride?: number; // Recalculated IF
  isModified?: boolean; // Flag indicating workout has been customized
}
```

### Workout Modification Feature (Feature 3)

**Overview:**
Coaches can customize scheduled workouts for individual athletes without changing the original workout template. This allows personalizing workout duration, intensity, or structure while preserving the base workout for other athletes.

**Use Case:**
A coach schedules "Sweet Spot Intervals (60 min)" for multiple athletes, but one athlete needs a shorter version due to time constraints. The coach can modify just that athlete's scheduled workout to 45 minutes without affecting other athletes or the original workout template.

**Features:**
- Edit button appears on workout cards (hover on desktop)
- Opens ScheduledWorkoutEditor modal
- Uses WorkoutBuilder component for structure editing
- Shows current stats (duration, TSS, IF) vs. original
- Automatically recalculates TSS and IF based on modifications
- Visual indicator when workout is modified
- Reset to original button available for modified workouts
- Changes are athlete-specific and don't affect the base workout

**Components:**
| Component | Location | Description |
|-----------|----------|-------------|
| ScheduledWorkoutEditor | `components/organisms/Calendar/ScheduledWorkoutEditor.tsx` | Modal for editing scheduled workout structure |
| WorkoutCard | `components/organisms/Calendar/WorkoutCard.tsx` | Added Edit button with Edit2 icon |
| WorkoutBuilder | `components/organisms/Coach/WorkoutBuilder.tsx` | Reused for structure editing |

**Business Logic:**
1. Coach clicks Edit button on scheduled workout card
2. Modal opens with current workout structure (override OR original)
3. Coach modifies structure using WorkoutBuilder interface
4. On save, backend:
   - Stores modified structure in `structureOverride` field
   - Calculates duration from new structure → `durationOverride`
   - Calculates TSS and IF from new structure → `tssOverride`, `ifOverride`
   - Sets `isModified` flag to `true`
5. Calendar displays modified workout with override values
6. Reset button clears all overrides and restores original workout

**TSS/IF Calculation:**
The backend automatically calculates TSS and IF from the modified structure:
- Duration: Sum of all step durations
- Intensity Factor (IF): Weighted average intensity based on step targets
- Training Stress Score (TSS): `duration_hours × IF² × 100`

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/week/{athleteId}?weekStart={date}` | Get training week |
| POST | `/api/calendar/week` | Create training week |
| POST | `/api/calendar/scheduled` | Add workout to day |
| DELETE | `/api/calendar/scheduled/{id}` | Remove scheduled workout |
| PUT | `/api/calendar/scheduled/{id}/complete` | Toggle completion |
| **PUT** | **`/api/calendar/scheduled/{id}/structure`** | **Modify workout structure** |
| **DELETE** | **`/api/calendar/scheduled/{id}/structure`** | **Reset to original structure** |

**Request/Response (Modify Structure):**
```typescript
// PUT /api/calendar/scheduled/:id/structure
Request: {
  structure: {
    steps: [
      { type: 'warmUp', length: { value: 10, unit: 'minute' }, targets: [...] },
      { type: 'active', length: { value: 20, unit: 'minute' }, targets: [...] },
      { type: 'coolDown', length: { value: 10, unit: 'minute' }, targets: [...] }
    ]
  }
}

Response: {
  id: "uuid",
  workoutId: "uuid",
  structureOverride: { ... },
  durationOverride: 2400, // seconds
  tssOverride: 65.5,
  ifOverride: 0.88,
  isModified: true,
  ...
}
```

**Request/Response (Reset Structure):**
```typescript
// DELETE /api/calendar/scheduled/:id/structure
Response: {
  id: "uuid",
  workoutId: "uuid",
  structureOverride: null,
  durationOverride: null,
  tssOverride: null,
  ifOverride: null,
  isModified: false,
  ...
}
```

**UI States:**
- **Normal workout:** Original workout structure displayed
- **Modified workout:**
  - Shows override values for duration/TSS/IF
  - Visual indicator (badge or border) showing "Modified"
  - Reset button available in edit modal
- **Edit modal:**
  - Shows "Original Stats" or "Modified Stats" header
  - Alert if workout already modified
  - WorkoutBuilder for editing structure
  - Save and Reset buttons in footer

**User Journey:**
See [Journey 25: Coach Modifies Scheduled Workout](#journey-25-coach-modifies-scheduled-workout)

---

## Settings & Availability

### Athlete Settings (`/settings`)

**Tabs:**
- **General** - Language, theme, appearance settings
- **Profile** - Edit onboarding data (athletes only)
- **Objectives** - Training goals with priorities (A, B, C)
- **Availability** - Weekly availability, unavailable dates, notes

**General Tab Features:**
- Language selection (EN, IT)
- Theme selection (Light, Dark, System)
- Color scheme customization

**Profile Tab Features (Athletes Only):**
After completing onboarding, athletes can edit their profile data from the Settings page:
- Personal info (name, birthday, sex, menstrual date)
- Physical data (height, weight)
- Athlete category
- Disciplines (with sub-type)
- Preferred terrain
- Training activities
- Equipment (power meter, HR monitor)

**Profile Settings Component:**
| Component | Location | Description |
|-----------|----------|-------------|
| ProfileSettings | `components/organisms/Settings/ProfileSettings.tsx` | Full profile editor |

**Objectives Tab Features:**
- Training goals with priorities (A, B, C)
- Event type selection
- Target duration
- Notes

**Availability Tab Features:**
- Weekly availability per day
- Hours available per day
- Indoor/Outdoor preference
- Specific unavailable dates (vacations, travel, etc.)
- General availability notes

**Weekly Availability Data Model:**
```typescript
interface DayAvailability {
  dayIndex: number; // 0-6 (Mon-Sun)
  isAvailable: boolean;
  maxHours: number;
  timeSlots: string[];
  preferredType: 'indoor' | 'outdoor' | 'any';
}
```

**Unavailable Date Data Model:**
```typescript
interface UnavailableDate {
  id: string;
  date: Date;
  reason?: string; // Optional reason like "Vacation", "Travel"
}
```

**Complete Availability Profile:**
```typescript
interface AvailabilityProfile {
  weeklyAvailability: DayAvailability[];
  unavailableDates: UnavailableDate[];
  notes?: string; // General notes about availability patterns
}
```

**Goals Data Model:**
```typescript
interface Goal {
  id: string;
  name: string;
  date: string;
  priority: 'A' | 'B' | 'C';
  eventType: string;
  targetDuration: number;
  notes: string;
}
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/athlete-settings/{athleteId}` | Get settings |
| PUT | `/api/athlete-settings/{athleteId}` | Update settings |
| GET | `/api/availability/{athleteId}/notes` | Get availability notes |
| PUT | `/api/availability/{athleteId}/notes` | Update availability notes |
| GET | `/api/availability/{athleteId}/unavailable-dates` | Get unavailable dates |
| POST | `/api/availability/{athleteId}/unavailable-dates/bulk` | Add multiple unavailable dates |
| DELETE | `/api/availability/{athleteId}/unavailable-dates/{date}` | Delete unavailable date by date string |

---

## Guided Tour & Setup Checklist

### Overview

After completing onboarding, new athletes see a guided tour that introduces them to key features. The tour uses React Joyride for tooltip-based walkthroughs and includes a persistent setup checklist for task tracking.

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| DashboardTour | `components/organisms/Tour/DashboardTour.tsx` | Joyride wrapper with 7 tour steps |
| SetupChecklist | `components/organisms/Tour/SetupChecklist.tsx` | Persistent checklist with expandable UI |
| useTour | `hooks/useTour.ts` | Hook for tour state management via API |

### Tour Steps

1. **Welcome** - Introduction to the dashboard
2. **Today's Workout** - Shows workout spotlight section
3. **Weekly Stats** - Explains progress tracking
4. **Upcoming Workouts** - Lists scheduled sessions
5. **Navigation** - Highlights nav bar links
6. **Settings** - Points to settings page
7. **Completion** - Encourages users to start

### Setup Checklist Items

| Item ID | Title | Target Action |
|---------|-------|---------------|
| `profile` | Complete Your Profile | Navigate to /settings |
| `availability` | Set Your Availability | Navigate to /settings |
| `goals` | Add Your Goals | Navigate to /settings |
| `assessment` | Take a Fitness Test | Start assessment from dashboard |

### Business Logic

**Tour State:**
- `tourCompleted`: Tour was fully completed
- `tourDismissed`: User skipped/dismissed the tour
- `setupChecklistCompleted`: Array of completed item IDs

**Display Logic:**
- Tour shows if: `onboardingCompleted && !tourCompleted && !tourDismissed`
- Checklist shows if: `onboardingCompleted && !tourDismissed && checklistItems.length < 4`
- Tour starts 500ms after page load to allow rendering

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me/tour` | Get tour state |
| PUT | `/api/users/me/tour` | Update tour state (tourCompleted, tourDismissed) |
| POST | `/api/users/me/tour/checklist/:itemId` | Mark checklist item completed |

### Data Model

```typescript
interface TourState {
  tourCompleted: boolean;
  tourDismissed: boolean;
  setupChecklistCompleted: string[];
}

type ChecklistItemId = 'profile' | 'availability' | 'goals' | 'assessment';
```

### i18n Keys

- `tour.checklist.*` - Checklist item titles and descriptions
- `tour.steps.*` - Tour step titles and content
- `tour.buttons.*` - Button labels (next, skip, back, finish)

---

## User Journeys for E2E Testing

### Journey 1: Coach Creates and Assigns Workout

**Preconditions:**
- Coach is logged in
- At least one athlete exists

**Steps:**
1. Navigate to `/coach`
2. Click "My Workouts" tab
3. Click "Create Workout" button
4. Fill in workout title: "Sweet Spot Intervals"
5. Select workout type: "Indoor Cycling"
6. Select category or create new one
7. Add warm up step (10 min, Zone 2)
8. Add interval block (5 repetitions)
   - Active step: 5 min, Zone 4
   - Rest step: 3 min, Zone 1
9. Add cool down step (10 min, Zone 2)
10. Click Save
11. Verify redirect to coach page
12. Verify workout appears in list
13. Click "Athletes" tab
14. Click athlete's "View Calendar" button
15. Drag newly created workout to Monday
16. Verify workout appears on calendar

**Expected Results:**
- Workout saved with correct structure
- Workout visible in coach's workout list
- Workout successfully scheduled on athlete calendar

---

### Journey 2: Athlete Completes Workout

**Preconditions:**
- Athlete is logged in
- Workout scheduled for current week

**Steps:**
1. Navigate to `/calendar`
2. Locate scheduled workout
3. Click on workout card
4. View workout details in modal
5. Click "Mark Complete" checkbox
6. Verify visual change (completed state)
7. Refresh page
8. Verify completion persisted

**Expected Results:**
- Workout marked as completed
- Visual indicator shows completion
- State persists after refresh

---

### Journey 3: Coach Invites New Athlete

**Preconditions:**
- Coach is logged in

**Steps:**
1. Navigate to `/coach`
2. Click "Invite Athlete" button
3. Enter email: "newathlete@example.com"
4. Enter name: "Test Athlete"
5. Add personal message: "Welcome to the team!"
6. Click "Send Invitation"
7. Verify success message
8. Verify invitation in pending list

**Expected Results:**
- Invitation created successfully
- Email sent (mock in tests)
- Invitation appears in pending list

---

### Journey 4: Athlete Accepts Invitation

**Preconditions:**
- Valid invitation token exists

**Steps:**
1. Navigate to `/invite/{token}`
2. Verify coach name displayed
3. Verify personal message shown
4. Enter name if required
5. Click "Accept Invitation"
6. Verify redirect to calendar

**Expected Results:**
- Athlete account created/linked
- Coach-athlete relationship established
- Redirect to calendar page

---

### Journey 5: Coach Edits Existing Workout

**Preconditions:**
- Coach is logged in
- At least one workout exists

**Steps:**
1. Navigate to `/coach`
2. Click "My Workouts" tab
3. Click on existing workout
4. Verify workout data populated in form
5. Modify title: append " v2"
6. Add new step
7. Click Save
8. Verify redirect to coach page
9. Verify updated title in list

**Expected Results:**
- Existing data loaded correctly
- Changes saved successfully
- Updated data reflected in list

---

### Journey 6: Coach Deletes Workout

**Preconditions:**
- Coach is logged in
- At least one workout exists (not scheduled)

**Steps:**
1. Navigate to `/coach`
2. Click "My Workouts" tab
3. Click more options (three dots) on workout
4. Click "Delete"
5. Verify confirmation dialog appears
6. Click "Delete" in dialog
7. Verify workout removed from list
8. Verify success toast

**Expected Results:**
- Confirmation required before delete
- Workout removed from database
- UI updates immediately
- Success feedback shown

---

### Journey 7: Athlete Sets Availability

**Preconditions:**
- Athlete is logged in

**Steps:**
1. Navigate to `/settings`
2. Toggle Monday to unavailable
3. Set Tuesday hours to 2
4. Set Wednesday preference to "Outdoor"
5. Click "Save Changes"
6. Verify success message
7. Navigate to `/calendar`
8. Verify Monday shows unavailable state

**Expected Results:**
- Settings saved successfully
- Calendar respects availability
- Cannot schedule on unavailable days

---

### Journey 8: Athlete Adds Training Goal

**Preconditions:**
- Athlete is logged in

**Steps:**
1. Navigate to `/settings`
2. Scroll to "Training Goals" section
3. Click "Add Goal"
4. Fill in event name: "Gran Fondo Milano"
5. Select date: 3 months from now
6. Select priority: "A - Primary Goal"
7. Select event type: "Gran Fondo"
8. Click "Save Goal"
9. Verify goal appears in list
10. Verify countdown shown

**Expected Results:**
- Goal saved successfully
- Displayed in goals list
- Countdown calculated correctly

---

### Journey 9: Coach Views Athlete Calendar

**Preconditions:**
- Coach is logged in
- Athlete has scheduled workouts

**Steps:**
1. Navigate to `/coach`
2. Locate athlete card
3. Click "View Calendar" button
4. Verify calendar loads for athlete
5. Verify coach can see athlete's workouts
6. Add workout from library
7. Verify workout scheduled

**Expected Results:**
- Calendar shows athlete context
- Coach can view all scheduled workouts
- Coach can add workouts to athlete calendar

---

### Journey 10: Mobile Calendar Interaction

**Preconditions:**
- User logged in
- Mobile viewport (< 768px)

**Steps:**
1. Navigate to `/calendar`
2. Verify mobile layout (workout library at top)
3. Tap on workout in library
4. Verify selection indicator
5. Tap on calendar day
6. Verify workout added to day
7. Tap on scheduled workout
8. Verify detail modal opens
9. Swipe to change weeks

**Expected Results:**
- Mobile-specific UI rendered
- Tap-to-select workflow works
- Modal interactions work on touch
- Week navigation accessible

---

### Journey 11: Coach Uses Monthly Calendar View

**Preconditions:**
- Coach is logged in
- Athlete has workouts scheduled across multiple weeks

**Steps:**
1. Navigate to `/coach`
2. Click athlete's "View Calendar" button
3. Click "Month" toggle button in header
4. Verify monthly calendar displays
5. Observe workout dots on days with workouts
6. Observe week summary (workout count) in left column
7. Hover over week summary for TSS/hours tooltip
8. Click on a week row
9. Verify switch to weekly view for that week
10. Click "Month" to return to monthly view

**Expected Results:**
- Month view shows all weeks in current month
- Days with workouts show dot indicators (max 3 dots + count)
- Week summaries show workout count
- Clicking week drills down to weekly view
- Week toggle switches views correctly

---

### Journey 12: Athlete Marks Unavailable Dates

**Preconditions:**
- Athlete is logged in

**Steps:**
1. Navigate to `/settings`
2. Scroll to "Unavailable Dates" section
3. Click on a future date in mini calendar
4. Verify date added to unavailable dates list with red highlight
5. Add reason: "Family vacation"
6. Click another date to add multiple
7. Click on existing unavailable date to remove it
8. Scroll to "Notes" section
9. Enter availability notes: "Prefer morning workouts on weekdays"
10. Click "Save Changes"
11. Verify success message
12. Navigate to `/calendar`
13. Verify unavailable dates show overlay/unavailable state
14. Attempt to schedule workout on unavailable date
15. Verify action is blocked with warning

**Expected Results:**
- Dates can be toggled on/off as unavailable
- Optional reasons saved with dates
- Availability notes persisted
- Calendar shows unavailable dates visually
- Cannot schedule workouts on unavailable dates

---

### Journey 13: Coach Reviews Dashboard

**Preconditions:**
- Coach is logged in
- Has at least one athlete with scheduled workouts
- Some athletes have completed workouts, some have missed

**Steps:**
1. Navigate to `/dashboard` (auto-redirects based on role)
2. Verify coach dashboard loads (not athlete dashboard)
3. View overview stats cards:
   - Total Athletes count
   - Overall Compliance percentage
   - Workouts Completed / Planned
   - TSS Completed / Planned
4. If athletes need attention, verify warning section appears
5. View weekly progress table with all athletes
6. Verify compliance color coding (green/orange/red)
7. Click on an athlete row
8. Verify navigation to `/athlete/:athleteId/calendar`
9. Navigate back to dashboard
10. View upcoming goals in sidebar
11. Click on a goal
12. Verify navigation to athlete's calendar
13. Use "Quick Actions" to navigate to:
    - Manage Athletes (`/coach`)
    - Create Workout (`/workout/new`)

**Expected Results:**
- Dashboard shows aggregated stats for current week
- Athletes with low compliance or missed workouts highlighted
- All athletes listed in progress table
- Clicking rows navigates to correct athlete calendars
- Goals display countdown to event date
- Quick actions provide navigation shortcuts

---

### Journey 14: New Athlete Experiences Guided Tour

**Preconditions:**
- Athlete has just completed onboarding (onboardingCompleted = true)
- Tour has not been completed or dismissed (tourCompleted = false, tourDismissed = false)

**Steps:**
1. Navigate to `/dashboard`
2. Wait for tour to start (500ms delay)
3. Verify welcome tooltip appears (centered)
4. Click "Next" to proceed through tour steps:
   - Today's Workout spotlight
   - Weekly Stats section
   - Upcoming Workouts
   - Navigation bar
   - Settings link
5. On final step, click "Finish"
6. Verify tour disappears
7. Verify Setup Checklist is visible
8. Click on "Complete Your Profile" checklist item
9. Verify navigation to `/settings`
10. Navigate back to `/dashboard`
11. Click checkbox on "Complete Your Profile"
12. Verify item marked as completed with checkmark
13. Verify progress updates (1/4 complete)
14. Click "Dismiss" on checklist
15. Verify checklist disappears
16. Refresh page
17. Verify tour does not restart
18. Verify checklist does not reappear (dismissed)

**Expected Results:**
- Tour starts automatically after onboarding
- Tour progresses through all 7 steps
- Tour completion persists (tourCompleted = true)
- Checklist items can be completed individually
- Dismissing checklist persists (tourDismissed = true)
- Neither tour nor checklist reappear after dismissal

---

### Journey 15: Athlete Skips Guided Tour

**Preconditions:**
- New athlete logged in
- Tour not yet completed

**Steps:**
1. Navigate to `/dashboard`
2. Wait for tour to start
3. Click "Skip" button on any tour step
4. Verify tour closes immediately
5. Verify Setup Checklist still visible
6. Refresh page
7. Verify tour does not restart
8. Verify checklist is still visible (can complete independently)

**Expected Results:**
- Skip button dismisses tour immediately
- Tour marked as dismissed, not completed
- Checklist remains accessible for independent task completion
- Skipping is permanent (tour won't restart)

---

### Journey 16: New Athlete Completes Onboarding

**Preconditions:**
- New athlete account created (via invitation or signup)
- Onboarding not yet completed

**Steps:**
1. Log in as new athlete
2. Verify redirect to `/onboarding`
3. **Step 1 - Personal Info:**
   - Enter first name: "Marco"
   - Enter last name: "Rossi"
   - Enter birthday: Select date 25 years ago
   - Select sex: "Male"
   - Click "Next"
4. **Step 2 - Physical Data:**
   - Enter height: 180 cm
   - Enter weight: 75 kg
   - Click "Next"
5. **Step 3 - Category:**
   - Select "Amatore"
   - Click "Next"
6. **Step 4 - Discipline:**
   - Select "Road" discipline
   - Select "Gran Fondo 2h+" sub-type
   - Click "Next"
7. **Step 5 - Terrain:**
   - Select "Hills (10-15')"
   - Click "Next"
8. **Step 6 - Availability:**
   - Set Monday: available, 2 hours
   - Set Wednesday: available, 1.5 hours
   - Set Saturday: available, 3 hours
   - Click "Next"
9. **Step 7 - Activities & Equipment:**
   - Select: Outdoor Cycling, Indoor Cycling, Gym
   - Check "I have a power meter"
   - Check "I have a heart rate monitor"
   - Click "Complete"
10. Verify redirect to `/dashboard`
11. Verify guided tour starts
12. Verify onboarding data saved (visible in settings)

**Expected Results:**
- All 7 steps completed sequentially
- Data persists between steps (can go back)
- Onboarding marked as completed
- Redirects to dashboard after completion
- Guided tour starts automatically

---

### Journey 17: Athlete Takes Monthly Assessment Test

**Preconditions:**
- Athlete is logged in
- Onboarding completed
- No assessment in past 30 days (or first assessment)

**Steps:**
1. Navigate to `/dashboard`
2. Verify AssessmentCard shows reminder:
   - If first test: "Complete your first assessment"
   - If overdue: "Time for your monthly assessment"
3. Click "Start Now" button on AssessmentCard
4. Verify Assessment modal opens
5. Select protocol: "Sprint + 12min Climb"
6. Fill in test results:
   - Sprint Peak Power: 850 W
   - Sprint Max HR: 185 bpm
   - 12' Climb Avg Power: 280 W
   - 12' Climb Max HR: 175 bpm
7. Add notes: "Felt strong today"
8. Click "Save"
9. Verify success message
10. Verify modal closes
11. Verify AssessmentCard updates (no longer shows reminder)
12. Navigate to settings or profile
13. Verify assessment results visible

**Expected Results:**
- Assessment modal opens from dashboard
- Protocol selection works
- All fields validated and saved
- Estimated FTP calculated from results
- Dashboard updates to reflect completed assessment
- Historical assessment accessible

---

### Journey 18: Athlete Edits Profile Settings

**Preconditions:**
- Athlete is logged in
- Onboarding completed

**Steps:**
1. Navigate to `/settings`
2. Click on "Profile" tab
3. Verify all onboarding data is pre-populated
4. **Edit Personal Info:**
   - Change weight from 75kg to 73kg
5. **Edit Category:**
   - Change from "Amatore" to "U23"
6. **Edit Equipment:**
   - Uncheck "I have a power meter"
7. Click "Save Profile"
8. Verify success toast
9. Refresh page
10. Navigate back to Profile tab
11. Verify changes persisted:
    - Weight shows 73kg
    - Category shows U23
    - Power meter unchecked

**Expected Results:**
- Profile tab shows all onboarding data
- Changes can be made to individual sections
- Save persists all changes
- Data survives page refresh
- Coach can see updated profile data

---

### Journey 19: Athlete Takes Alternative Assessment Protocol

**Preconditions:**
- Athlete is logged in
- Has power meter access

**Steps:**
1. Navigate to `/dashboard`
2. Click "Start Assessment" in AssessmentCard
3. Select protocol: "1/2/5 Minute Efforts"
4. Fill in test results:
   - 1 min Avg Power: 450 W, Max HR: 180 bpm
   - 2 min Avg Power: 380 W, Max HR: 178 bpm
   - 5 min Avg Power: 320 W, Max HR: 172 bpm
5. Click "Save"
6. Verify success message
7. Verify assessment saved with correct protocol type

**Expected Results:**
- Alternative protocol form displays correct fields
- All fields are AVERAGE power (not peak)
- Results saved successfully
- Protocol type recorded correctly

---

### Journey 20: Athlete Views and Logs Workout Results

**Preconditions:**
- Athlete is logged in
- Has at least one workout scheduled on the calendar

**Steps:**
1. Navigate to `/calendar`
2. Click on a scheduled workout card
3. Verify WorkoutViewerModal opens
4. Verify "Structure" tab is active by default
5. Observe workout chart visualization
6. Observe interval list with step details
7. Click "Report" tab
8. If workout not completed:
   - Verify message "You haven't logged results..."
   - Fill in actual duration: 1:30:00
   - Fill in distance: 45.5 km
   - Fill in avg power: 180 W
   - Fill in avg HR: 145 bpm
   - Select RPE: 7
   - Select feeling: "Good"
   - Add notes: "Felt strong throughout"
   - Click "Save"
9. Verify success toast
10. Verify modal remains open with saved data
11. Modify notes: append " - great session!"
12. Click "Save" again
13. Verify update success
14. Close modal
15. Click same workout again
16. Verify saved data is displayed

**Expected Results:**
- Modal opens with workout structure visualization
- Report tab allows entering/editing results
- Results save and persist correctly
- Saved data displays on subsequent opens

---

### Journey 21: Coach Views Athlete Workout Report

**Preconditions:**
- Coach is logged in
- Athlete has completed workout with logged results

**Steps:**
1. Navigate to `/calendar` (coach calendar view)
2. Click on a completed workout (with athlete color indicator)
3. Verify WorkoutViewerModal opens
4. Verify "Structure" tab shows workout chart
5. Click "Report" tab
6. Verify read-only display of athlete results:
   - Actual Duration displayed
   - Distance displayed
   - Avg Power displayed
   - Avg HR displayed
   - RPE displayed
   - Feeling badge displayed
   - Athlete Notes displayed
7. Verify no edit buttons or form fields (read-only)
8. Close modal

**Expected Results:**
- Coach can view workout structure
- Coach sees athlete's logged results (read-only)
- No ability to edit athlete's results
- All result fields displayed correctly

---

### Journey 22: Coach Views Incomplete Workout Report

**Preconditions:**
- Coach is logged in
- Athlete has scheduled workout that is NOT completed

**Steps:**
1. Navigate to `/calendar` (coach calendar view)
2. Click on an incomplete workout
3. Verify WorkoutViewerModal opens
4. Click "Report" tab
5. Verify message: "This workout hasn't been completed yet..."
6. Verify no result data displayed
7. Close modal

**Expected Results:**
- Coach sees appropriate message for incomplete workout
- No empty result fields shown
- Clear indication that athlete hasn't logged results yet

---

### Journey 23: Coach Views Athlete Training Zones

**Preconditions:**
- Coach is logged in
- Athlete has completed an assessment test (FTP and/or Max HR set)

**Steps:**
1. Navigate to `/coach`
2. Click on an athlete card
3. Click "View Stats" button or navigate to `/athlete/:athleteId/stats`
4. Scroll to "Training Zones" section
5. Verify Power Zones table is visible:
   - FTP badge shows athlete's current FTP
   - 6 zones displayed (Z1-Z6)
   - Each zone shows name, watt range, and %FTP
6. Verify HR Zones table is visible:
   - Max HR badge shows athlete's current Max HR
   - 5 zones displayed (Z1-Z5)
   - Each zone shows name, BPM range, and %FC Soglia
7. If athlete has no FTP, verify message: "No FTP data - complete an assessment test"
8. If athlete has no Max HR, verify message: "No Max HR data - complete an assessment test"

**Expected Results:**
- Training zones section displays after assessment data
- Power zones calculated correctly from FTP
- HR zones calculated correctly from Max HR (via FC Soglia = 93% of Max HR)
- Empty state messages shown when data is missing
- Zone colors follow standard color scheme (gray, blue, green, yellow, orange, red)

---

### Journey 24: Assessment Updates Training Zones

**Preconditions:**
- Athlete is logged in
- Has no prior assessment

**Steps:**
1. Navigate to `/dashboard`
2. Click "Start Assessment" on AssessmentCard
3. Select "Sprint + 12min Climb" protocol
4. Fill in test results:
   - Sprint Peak Power: 900 W
   - Sprint Max HR: 188 bpm
   - 12' Climb Avg Power: 280 W
   - 12' Climb Max HR: 175 bpm
5. Click "Save"
6. Navigate to profile/settings
7. Verify FTP is updated to ~266W (95% of 280)
8. Verify Max HR is updated to 188 bpm
9. Navigate to `/athlete/:athleteId/stats` (or have coach view)
10. Verify Power Zones show correct watt ranges based on FTP
11. Verify HR Zones show correct BPM ranges based on Max HR

**Expected Results:**
- FTP automatically calculated from 12' climb power (× 0.95)
- Max HR automatically updated from highest HR in test
- Training zones immediately recalculated with new values
- Coach can see updated zones on athlete stats page

---

### Journey 25: Coach Modifies Scheduled Workout

**Preconditions:**
- Coach is logged in
- Has at least one athlete with a scheduled workout on their calendar

**Steps:**
1. Navigate to `/coach`
2. Click on an athlete card to view their calendar
3. Verify navigation to `/athlete/:athleteId/calendar`
4. Hover over a scheduled workout card
5. Verify Edit button (pencil icon) appears on hover
6. Click Edit button
7. Verify ScheduledWorkoutEditor modal opens
8. Observe current stats badge showing duration, TSS, IF
9. If workout was previously modified, verify:
   - Alert appears: "This workout has been customized"
   - "Reset to Original" button is visible
10. Modify the workout structure:
    - Change first step duration from 10 to 15 minutes
    - Or add a new step
    - Or adjust intensity targets
11. Observe updated duration/TSS/IF values updating in real-time
12. Click "Save"
13. Verify success toast: "Workout Modified"
14. Verify modal closes
15. Observe workout card now shows modified values
16. Click Edit button again
17. Observe modified stats displayed
18. Click "Reset to Original" button
19. Verify confirmation or success toast
20. Verify workout card shows original values
21. Verify isModified flag is false

**API Calls Expected:**
- `PUT /api/calendar/scheduled/:id/structure` when saving modifications
- `DELETE /api/calendar/scheduled/:id/structure` when resetting to original
- Backend should return updated ScheduledWorkout with:
  - `structureOverride` populated (or null after reset)
  - `durationOverride` calculated (or null after reset)
  - `tssOverride` calculated (or null after reset)
  - `ifOverride` calculated (or null after reset)
  - `isModified: true` (or false after reset)

**Expected Results:**
- Edit button appears on hover over workout cards
- ScheduledWorkoutEditor modal opens with WorkoutBuilder
- Modifications are saved with recalculated metrics
- Modified workouts display override values
- Reset button restores original workout structure
- Changes are athlete-specific (don't affect other athletes or base workout)
- Visual indicator shows when workout is modified
- All metrics (duration, TSS, IF) automatically recalculated by backend

**Error Scenarios:**
- Save fails (500 error): Shows error toast, modal stays open
- Invalid structure: Backend validation error, shows error toast
- Non-existent workout (404): Shows error toast
- Network error: Shows error toast with retry option

**Cypress Test:**
See `cypress/e2e/workout-modification.cy.ts` for complete E2E test coverage

---

## Test Data Requirements

### Users
```json
{
  "coach": {
    "email": "coach@example.com",
    "role": "COACH"
  },
  "athlete": {
    "email": "athlete@example.com",
    "role": "ATHLETE",
    "coachId": "<coach_id>"
  }
}
```

### Sample Workout
```json
{
  "name": "Test Workout",
  "slug": "test-workout",
  "workoutType": "indoorCycling",
  "durationSeconds": 3600,
  "tssPlanned": 65,
  "ifPlanned": 0.85,
  "categoryId": "<category_id>",
  "structure": {
    "structure": [
      {
        "type": "warmUp",
        "length": { "value": 10, "unit": "minute" },
        "name": "Warm Up"
      }
    ]
  }
}
```

---

## Component Test IDs

For e2e testing, key components have data-testid attributes:

| Component | Test ID |
|-----------|---------|
| Coach Athletes Tab | `coach-athletes-tab` |
| Coach Workouts Tab | `coach-workouts-tab` |
| Create Workout Button | `create-workout-btn` |
| Workout Card | `workout-card-{id}` |
| Athlete Card | `athlete-card-{id}` |
| Calendar Day | `calendar-day-{index}` |
| Workout Builder Save | `workout-save-btn` |
| Delete Confirmation | `delete-confirm-btn` |
| View Workout Modal | `workout-view-modal` |
| Workout Viewer Modal | `workout-viewer-modal` |
| Workout Viewer Structure Tab | `workout-viewer-structure-tab` |
| Workout Viewer Report Tab | `workout-viewer-report-tab` |

---

## API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 403 | Forbidden (wrong role) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Server Error |

---

## i18n Keys Reference

All user-facing text uses i18n keys. Key namespaces:
- `common.*` - Shared buttons, labels
- `nav.*` - Navigation items
- `auth.*` - Authentication text
- `calendar.*` - Calendar-specific
- `library.*` - Workout library
- `workout.*` - Workout details
- `coach.*` - Coach dashboard
- `builder.*` - Workout builder
- `settings.*` - Settings page (tabs, profile editing)
- `goals.*` - Training goals
- `invite.*` - Invitation flow
- `onboarding.*` - Onboarding wizard (steps, fields, categories, disciplines, terrains, activities)
- `assessment.*` - Assessment tests (protocols, fields, units, reminders)
- `tour.*` - Guided tour and setup checklist
- `workoutViewer.*` - Workout viewer modal (structure, report, results, athleteNotes, notCompleted messages)

Supported locales: `en`, `it`

---

## Future Features / Roadmap

This section documents features from the original requirements document that have not yet been implemented. These are organized by priority.

---

### CRITICAL - Core Differentiators

These features represent the core value proposition that differentiates RidePro from competitors.

#### 1. Auto Plan Generation Engine

**Description:**
The flagship feature - intelligent, auto-generated training plans based on athlete profile and goals.

**3-Week Onboarding Protocol:**
| Week | Purpose | Activities |
|------|---------|------------|
| Week 1 | Adaptation | Unstructured riding, coach observes baseline |
| Week 2 | CP Tests | Critical Power tests (Sprint+12 or 1/2/5min) |
| Week 3+ | Personalized Plan | 24-week periodized plan generated |

**Business Logic:**
- Generate 24-week periodized plan based on:
  - Goal event date(s) and priority (A/B/C)
  - Weekly availability (hours/days)
  - Athlete category and discipline
  - CP test results → training zones
  - Terrain preference
- Periodization phases: Base → Build → Peak → Taper
- Auto-adjust for rest weeks every 3-4 weeks
- Consider athlete's experience level for progression rate

**Implementation Notes:**
- Backend algorithm service for plan generation
- Integration with assessment results for zone calculation
- Re-generation triggers: new goal, significant CP change, athlete request

---

#### 2. Zone Calculation System (IMPLEMENTED)

**Status: IMPLEMENTED** - See [Training Zones](#training-zones) section above.

**Description:**
Automatically calculate training zones from assessment test results.

**Zone Models:**
- **Power Zones** (7 zones based on FTP/CP)
- **Heart Rate Zones** (5 zones based on LTHR)
- **RPE Zones** (Borg Scale 6-20 fallback)

**Power Zone Calculation (from CP):**
| Zone | Name | % of FTP |
|------|------|----------|
| Z1 | Recovery | < 55% |
| Z2 | Endurance | 55-75% |
| Z3 | Tempo | 76-90% |
| Z4 | Threshold | 91-105% |
| Z5 | VO2max | 106-120% |
| Z6 | Anaerobic | 121-150% |
| Z7 | Neuromuscular | > 150% |

**HR Zone Calculation (from LTHR):**
| Zone | Name | % of LTHR |
|------|------|-----------|
| Z1 | Recovery | < 68% |
| Z2 | Aerobic | 68-83% |
| Z3 | Tempo | 84-94% |
| Z4 | Threshold | 95-105% |
| Z5 | Anaerobic | > 105% |

**Borg Scale Fallback (RPE 6-20):**
For athletes without power meters, use perceived exertion:
| RPE | Effort Level | Equivalent Zone |
|-----|--------------|-----------------|
| 6-9 | Very Light | Z1 |
| 10-11 | Light | Z2 |
| 12-13 | Moderate | Z3 |
| 14-16 | Hard | Z4 |
| 17-19 | Very Hard | Z5-Z6 |
| 20 | Maximum | Z7 |

**API Endpoints (Proposed):**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/zones/:athleteId` | Get calculated zones |
| POST | `/api/zones/:athleteId/calculate` | Recalculate from latest assessment |
| PUT | `/api/zones/:athleteId/override` | Manual zone override |

---

#### 3. Third-Party Integrations

**Description:**
Auto-sync workout data from fitness platforms.

**Supported Platforms:**
- **Strava** - Activity sync, power/HR data
- **Garmin Connect** - Activity sync, advanced metrics
- **Wahoo** - Activity sync, structured workouts

**Features:**
- OAuth2 authentication flow
- Automatic activity import after upload
- Map planned workouts to completed activities
- Import actual power/HR/duration to workout reports
- Sync assessment data from outdoor rides

**Implementation Notes:**
- Backend integration service per platform
- Webhook support for real-time sync (where available)
- Activity matching algorithm (date + duration similarity)
- Settings page for connection management

**API Endpoints (Proposed):**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/:athleteId` | List connected integrations |
| POST | `/api/integrations/:athleteId/strava/connect` | Initiate Strava OAuth |
| POST | `/api/integrations/:athleteId/strava/callback` | OAuth callback |
| DELETE | `/api/integrations/:athleteId/strava` | Disconnect Strava |
| POST | `/api/integrations/:athleteId/sync` | Manual sync trigger |

---

#### 4. AI Chat Assistant

**Description:**
Conversational AI for plan adjustments and athlete-coach communication.

**Capabilities:**
- Request plan modifications ("I'm too tired this week")
- Report fatigue/illness/injury
- Ask training questions
- Get workout explanations
- Request rest days or reduced load

**Example Interactions:**
```
Athlete: "I have a cold, can you adjust my training?"
AI: "I'll reduce your intensity for the next 3 days and replace intervals with Z2 endurance rides. Take an extra rest day if needed."

Athlete: "Why am I doing so many Z2 rides?"
AI: "You're in your base building phase. Z2 rides build aerobic capacity, which is the foundation for higher intensity work later in your plan."
```

**Implementation Notes:**
- LLM integration (Claude API or similar)
- Context includes: athlete profile, current plan, recent workouts, goals
- Coach notification for significant changes
- Chat history persistence

---

### HIGH PRIORITY - Enhanced Functionality

Features that significantly improve the user experience.

#### 5. Extended Performance Data

**Additional Fields for User Profile:**
- **Max Heart Rate** (measured or calculated 220-age)
- **Resting Heart Rate** (morning measurement)
- **LTHR** (Lactate Threshold Heart Rate)
- **VO2Max** (estimated or from test)
- **Weight History** (track changes over time)

**Database Schema Additions:**
```prisma
model User {
  // ... existing fields ...
  maxHeartRate      Int?      @map("max_heart_rate")
  restingHeartRate  Int?      @map("resting_heart_rate")
  lthr              Int?      // Lactate Threshold HR
  vo2max            Float?    // ml/kg/min
}

model WeightHistory {
  id        String   @id @default(uuid())
  athleteId String   @map("athlete_id")
  athlete   User     @relation(fields: [athleteId], references: [id])
  weight    Float    // kg
  date      DateTime @db.Date
  @@index([athleteId])
  @@map("weight_history")
}
```

---

#### 6. Experience Level in Onboarding

**Add to Onboarding Step 3 or new step:**

| Level | Description | Plan Characteristics |
|-------|-------------|---------------------|
| Beginner | < 1 year cycling | Slower progression, more rest, simpler workouts |
| Intermediate | 1-3 years | Moderate progression, standard periodization |
| Advanced | 3+ years | Faster progression, complex intervals, less rest |

**Impact on Plan Generation:**
- Beginner: Max 3 workouts/week, focus on consistency
- Intermediate: 4-5 workouts/week, introduce intervals
- Advanced: 5-6 workouts/week, complex periodization

---

#### 7. Coach Selection / Marketplace

**Description:**
Athletes without a coach can browse and select from available coaches.

**Features:**
- Coach profiles (bio, specialization, certifications)
- Coach availability and pricing
- Athlete reviews/ratings
- Request coaching relationship
- Coach acceptance workflow

**Components (Proposed):**
- `CoachMarketplace.tsx` - Browse coaches
- `CoachProfile.tsx` - Detailed coach view
- `CoachRequestModal.tsx` - Request coaching

---

#### 8. Payment Integration (Stripe)

**Description:**
Monetization through subscription plans.

**Subscription Tiers:**
| Tier | Price | Features |
|------|-------|----------|
| Free | €0 | Basic calendar, manual workouts |
| Athlete Pro | €9.99/mo | Auto plans, integrations, AI chat |
| Coach | €29.99/mo | Unlimited athletes, advanced analytics |

**Implementation:**
- Stripe integration for payments
- Subscription management
- Feature gating based on tier
- Trial period support

---

#### 9. Borg Scale RPE Fallback

**Already Documented Above in Zone Calculation**

For athletes without power meters, provide RPE-based workout targets using the Borg Scale (6-20).

---

### MEDIUM PRIORITY - Future Enhancements

Features for long-term development.

#### 10. Advanced Analytics Dashboard

**Metrics to Display:**
- Performance Management Chart (CTL/ATL/TSB)
- Power curve (best efforts over time)
- Training load trends
- Zone distribution
- Progress toward goals

**Components (Proposed):**
- `PerformanceChart.tsx` - CTL/ATL/TSB visualization
- `PowerCurve.tsx` - Best efforts curve
- `TrainingLoadChart.tsx` - Weekly load trends
- `ZoneDistribution.tsx` - Pie/bar chart of time in zones

---

#### 11. Adaptive Plan Modifications

**Description:**
Automatically adjust the plan based on completed workout data.

**Triggers for Adaptation:**
- Missed workouts (reschedule or adjust load)
- Over/under performance (adjust targets)
- Fatigue indicators (reduce intensity)
- Life events (vacation, illness)

**Implementation Notes:**
- Compare planned vs actual workout data
- Calculate accumulated fatigue
- Suggest or auto-apply modifications
- Coach approval workflow (optional)

---

#### 12. Macro-Objectives for Non-Racers

**Description:**
For athletes not targeting specific events, provide general fitness objectives.

**Objective Types:**
| Objective | Description |
|-----------|-------------|
| General Fitness | Maintain/improve overall cycling fitness |
| Weight Management | Focus on calorie burn, longer Z2 rides |
| Endurance Building | Increase base fitness for longer rides |
| Power Improvement | Increase FTP through structured intervals |
| Event Preparation | General prep without specific date |

**Impact on Plan:**
- Continuous periodization (no specific peak)
- Rolling 8-12 week cycles
- Flexible intensity distribution

---

#### 13. Fixed vs Flexible Days Preference

**Description:**
Athletes can specify if certain days must always have training or must always be rest.

**Settings:**
- Fixed training days (always schedule here)
- Fixed rest days (never schedule here)
- Flexible days (schedule based on load)

**Example:**
```
Monday: Flexible
Tuesday: Fixed Training (after-work ride)
Wednesday: Flexible
Thursday: Fixed Rest (family night)
Friday: Flexible
Saturday: Fixed Training (long ride)
Sunday: Flexible
```

---

### Implementation Priority Matrix

| Feature | Priority | Effort | Dependencies |
|---------|----------|--------|--------------|
| Zone Calculation | Critical | Medium | Assessment Tests (done) |
| Auto Plan Generation | Critical | High | Zone Calculation |
| Strava Integration | Critical | High | None |
| AI Chat | Critical | High | Plan Generation |
| Extended Performance Data | High | Low | None |
| Experience Level | High | Low | None |
| Coach Marketplace | High | Medium | Payment Integration |
| Payment Integration | High | High | None |
| Borg Scale RPE | High | Low | Zone Calculation |
| Analytics Dashboard | Medium | High | Third-party integrations |
| Adaptive Plans | Medium | High | Plan Generation |
| Macro-Objectives | Medium | Medium | Plan Generation |
| Fixed/Flexible Days | Medium | Low | None |

---

### Phase Implementation Suggestion

**Phase 2: Core Intelligence**
1. Zone Calculation System
2. Extended Performance Data
3. Experience Level in Onboarding
4. Borg Scale RPE Fallback
5. Fixed/Flexible Days

**Phase 3: Auto Planning**
1. Auto Plan Generation Engine
2. Macro-Objectives for Non-Racers
3. Adaptive Plan Modifications

**Phase 4: Integrations**
1. Strava Integration
2. Garmin Connect Integration
3. Wahoo Integration

**Phase 5: Monetization & Growth**
1. Payment Integration (Stripe)
2. Coach Marketplace
3. AI Chat Assistant

**Phase 6: Advanced Features**
1. Advanced Analytics Dashboard
2. Performance Management Chart
3. Power Curve Analysis
