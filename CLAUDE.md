# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript compile + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Project Goal

Full-featured cycling training platform with workout visualization, calendar scheduling, and coach/athlete management. Integrates with a NestJS backend API for data persistence.

## Architecture

React + TypeScript + Vite app using:
- **Chakra UI** - Component library with theme support
- **visx** - Airbnb's D3 wrapper for workout charts
- **React Router** - Client-side routing
- **react-i18next** - Internationalization (en, it)
- **date-fns** - Date manipulation

### Project Structure

```
src/
├── components/
│   ├── atoms/           # Basic UI elements
│   ├── molecules/       # Composed components
│   └── organisms/       # Complex components
│       └── Calendar/    # WeeklyCalendar, DayColumn, WorkoutLibrarySidebar
├── contexts/            # React contexts (UserContext)
├── data/                # Static workout library data
├── hooks/               # Custom React hooks
│   ├── useAthletes.ts   # Coach's athlete management
│   └── useCalendarAPI.ts # Calendar, workouts, athlete settings
├── i18n/                # Translations (en.json, it.json)
├── pages/               # Route components
├── services/            # API client
├── types/               # TypeScript definitions
└── utils/               # Parser, helpers
```

### Key Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirects to `/dashboard` | |
| `/dashboard` | DashboardPage (dynamic) | Shows CoachDashboardPage for coaches, AthleteDashboardPage for athletes |
| `/calendar` | CalendarPage | Athlete's own calendar view |
| `/visualizer` | VisualizerPage | Workout chart visualizer |
| `/settings` | AvailabilityPage | Athlete availability & goals |
| `/coach` | CoachPage | Coach athlete management & workouts |
| `/athlete/:athleteId/calendar` | AthleteCalendarPage | Coach assigns workouts to athlete |
| `/athlete/:athleteId/stats` | AthleteStatsPage | Athlete statistics view |
| `/invite/accept/:token` | InvitationAcceptPage | Accept coach invitation (with Clerk signup) |
| `/workout/new` | WorkoutBuilderPage | Create new workout |
| `/workout/:id` | WorkoutBuilderPage | Edit existing workout |
| `/onboarding` | OnboardingPage | 7-step athlete onboarding wizard |

## Key Components

### Calendar System

**WeeklyCalendar** (`src/components/organisms/Calendar/WeeklyCalendar.tsx`)
- 7-day grid view with week navigation
- Supports controlled/uncontrolled week state
- Handles unavailable days display (greyed out)
- Slide animations between weeks (framer-motion)
- Skeleton loaders during week data fetch
- Props: `scheduledWorkouts`, `unavailableDays`, `weekStart`, `onWeekChange`, `dayCapacities`, `isLoading`

**MonthlyCalendar** (`src/components/organisms/Calendar/MonthlyCalendar.tsx`)
- Month overview with workout indicators (dots per day)
- Click week row to drill down to weekly view
- Shows weekly workout/TSS/hours summaries
- Highlights today, unavailable days greyed out
- Props: `scheduledWorkouts`, `month`, `onMonthChange`, `onWeekClick`, `unavailableDays`

**DayColumn** (`src/components/organisms/Calendar/DayColumn.tsx`)
- Individual day with drag-drop support
- Blocks drops on unavailable days
- Shows workout cards with remove option
- Capacity load bar (progress indicator for allocated hours)
- Skeleton loading state during fetch
- Props include `isLoading`, `maxHours`, `isUnavailable`

**WorkoutLibrarySidebar** (`src/components/organisms/Calendar/WorkoutLibrarySidebar.tsx`)
- Dual mode: local library or API workouts
- Search and category filtering
- Draggable workout items
- API props: `apiWorkouts`, `apiCategories`, `onApiWorkoutTap`

### Workout Upload

**WorkoutUploadModal** (`src/components/organisms/WorkoutUpload/WorkoutUploadModal.tsx`)
- Three-step wizard for importing external workout files
- Step 1 (Upload): Drag & drop or click to select file (.zwo, .erg, .mrc)
- Step 2 (Preview): Shows parsed workout name, duration, segments, format, author
- Step 3 (Customize): Edit name, description, select category before import
- Uses `useWorkoutUpload` hook for file parsing and conversion
- Props: `isOpen`, `onClose`, `onImport: (workout: ConvertedWorkout) => Promise<void>`, `categories`
- Integrated into `WorkoutLibrary` via optional `onImportWorkout` prop

**WorkoutLibrary** (`src/components/organisms/WorkoutLibrary.tsx`)
- Modal for browsing local workout library
- Optional Import button (appears when `onImportWorkout` prop is provided)
- Opens WorkoutUploadModal for external file import
- Props: `isOpen`, `onClose`, `onSelectWorkout`, `onImportWorkout?`, `categories?`

### Custom Hooks

**useCalendarAPI** (`src/hooks/useCalendarAPI.ts`)
```typescript
const {
  scheduledWorkouts,  // ScheduledWorkout[]
  isLoading,          // true only on initial load
  isFetching,         // true during any fetch (use for skeleton loaders)
  addWorkout,         // (workoutId, dayIndex) => Promise
  removeWorkout,      // (scheduledId) => Promise
  toggleComplete,     // (scheduledId, completed) => Promise
} = useCalendarAPI({ athleteId, weekStart, coachId });
```
- Fetches training week from `/api/calendar/week/:athleteId?weekStart=`
- Debounced fetching (300ms) to prevent rapid API calls during navigation
- Creates week on first workout add
- Persists scheduled workouts to database
- `isLoading` = first load only, `isFetching` = any fetch including subsequent weeks

**useCalendarMonthAPI** (`src/hooks/useCalendarAPI.ts`)
```typescript
const { scheduledWorkouts } = useCalendarMonthAPI({
  athleteId,
  startDate,  // First day of month view range
  endDate,    // Last day of month view range
});
```
- Fetches multiple weeks for monthly calendar view
- Returns workouts with `date` property for day matching

**useWorkoutsAPI** (`src/hooks/useCalendarAPI.ts`)
```typescript
const { workouts, categories, isLoading } = useWorkoutsAPI();
```
- Fetches all workouts from `/api/workouts`
- Fetches categories from `/api/workouts/categories`

**useAthleteSettings** (`src/hooks/useCalendarAPI.ts`)
```typescript
const { availability, goals, unavailableDays, isLoading } = useAthleteSettings(athleteId);
```
- Fetches from `/api/athlete-settings/:athleteId`
- Computes `unavailableDays` array (day indices 0-6 where athlete is unavailable)

**createWorkout / updateWorkout** (`src/hooks/useCalendarAPI.ts`)
```typescript
import { createWorkout, updateWorkout, type CreateWorkoutPayload } from '../hooks/useCalendarAPI';

const payload: CreateWorkoutPayload = {
  slug: 'sweet-spot-intervals-abc123',
  name: 'Sweet Spot Intervals',
  description: 'Optional description',
  durationSeconds: 3600,
  durationCategory: 'SHORT' | 'MEDIUM' | 'LONG',
  tssPlanned: 75,
  ifPlanned: 0.85,
  structure: { structure: [...] },
  categoryId: 'uuid',
  coachId: 'uuid', // optional, null = system workout
};

const newWorkout = await createWorkout(payload);
const updatedWorkout = await updateWorkout(workoutId, payload);
```

**useCoachDashboardAPI** (`src/hooks/useCalendarAPI.ts`)
```typescript
const {
  overview,               // CoachDashboardOverview (total athletes, workouts, compliance, TSS)
  athleteProgress,        // AthleteProgress[] (per-athlete stats)
  athletesNeedingAttention, // AthleteProgress[] (low compliance or missed workouts)
  upcomingGoals,          // CoachDashboardGoal[] (upcoming goals across all athletes)
  isLoading,
  error,
  refetch,
} = useCoachDashboardAPI({ coachId, weekStart });
```
- Fetches aggregated coach dashboard data from `/api/calendar/coach/:coachId/dashboard?weekStart=`
- Overview includes: totalAthletes, totalWorkoutsPlanned/Completed, overallCompliance, totalTSSPlanned/Completed
- Per-athlete progress: workoutsPlanned/Completed, compliance%, TSS, hours, missedWorkouts
- Athletes needing attention: compliance < 50% OR has missed workouts
- Upcoming goals: next 10 goals across all athletes sorted by date

**useAthletes** (`src/hooks/useAthletes.ts`)
- Fetches coach's athletes from `/api/users/coach/:coachId/athletes`

**useOnboarding** (`src/hooks/useOnboarding.ts`)
```typescript
const {
  status,           // { completed: boolean, currentStep?: number }
  isLoading,
  saveStep,         // (stepNumber, data) => Promise
  completeOnboarding, // () => Promise
} = useOnboarding({ athleteId });
```
- Manages athlete onboarding state
- Fetches status from `/api/onboarding/:athleteId/status`
- Saves step data to `/api/onboarding/:athleteId/step/:stepNumber`
- Marks onboarding complete via `/api/onboarding/:athleteId/complete`

**useAssessments** (`src/hooks/useAssessments.ts`)
```typescript
const {
  assessments,        // Assessment[] (completed only)
  latestAssessment,   // Assessment | null (most recent completed)
  ongoingTest,        // OngoingTest | null (current in-progress test)
  isLoading,
  isSaving,
  // 2-day workflow
  startTest,          // () => Promise<Assessment>
  completeDay1,       // (id, data: Day1Data) => Promise<Assessment>
  startDay2,          // (id) => Promise<Assessment>
  completeDay2,       // (id, data: Day2Data) => Promise<Assessment>
  deleteAssessment,   // (id) => Promise<void>
  // Data refresh
  fetchAssessments,
  fetchLatestAssessment,
  fetchOngoingTest,
} = useAssessments({ athleteId });
```
- **2-Day Assessment Protocol**: Day 1 (1'/2'/5' efforts) + Day 2 (5" sprint + 12' climb) on 6-7% gradient
- Athletes have 15 days to complete Day 2 after Day 1
- Progressive workflow: Can't skip Day 1, must complete in order
- Only one ongoing test at a time per athlete
- Status flow: DAY1_PENDING → DAY1_COMPLETED → DAY2_PENDING → COMPLETED (or EXPIRED)
- Auto-calculates FTP (climb12min × 0.95) and maxHR when Day 2 completes
- Auto-updates athlete profile with new FTP/maxHR
- Tests can be cancelled/deleted only while in progress (not after completion)

**useCoachAssessmentStatus** (`src/hooks/useAssessments.ts`)
```typescript
const {
  athletes,                    // AthleteAssessmentStatus[] (all athletes)
  athletesNeedingAssessment,   // AthleteAssessmentStatus[] (no assessment or overdue >30 days)
  athletesWithNewAssessment,   // AthleteAssessmentStatus[] (submitted in last 24h)
  isLoading,
  error,
  refetch,
} = useCoachAssessmentStatus(coachId);
```
- Fetches from `/api/assessments/coach/:coachId/status`
- Used in CoachDashboardPage for assessment notifications
- Shows coaches which athletes submitted tests (new) and which need testing (overdue)

**useAthleteStats** (`src/hooks/useAssessments.ts`)
```typescript
const {
  stats,     // AthleteStatsData | null
  isLoading,
  error,
  refetch,
} = useAthleteStats(athleteId);
// stats.athlete: { id, fullName, email, ftp, heightCm, weightKg }
// stats.assessment: { hasAssessment, isOverdue, daysSinceTest, latestAssessment, ftpProgress, wattsPerKg, assessmentHistory }
```
- Fetches from `/api/assessments/athlete/:athleteId/stats`
- Used in AthleteStatsPage for real athlete/assessment data
- Calculates FTP progress (current vs previous) and W/kg

**useZones** (`src/hooks/useZones.ts`)
```typescript
const {
  zonesData,        // AthleteZonesResponse | null
  loading,          // boolean
  error,            // string | null
  fetchZones,       // (athleteId: string) => Promise<void>
  updatePowerZones, // (athleteId: string, data: UpdatePowerZonesInput) => Promise<void>
  updateHRZones,    // (athleteId: string, data: UpdateHRZonesInput) => Promise<void>
  updateAthleteData, // (athleteId: string, data: UpdateAthleteZoneDataInput) => Promise<void>
  calculatePowerZones, // (ftp: number, zoneConfig?) => Promise<CalculatedPowerZone[]>
  calculateHRZones,    // (maxHR: number, method?, restingHR?, zoneConfig?) => Promise<CalculatedHRZone[]>
} = useZones();
```
- Fetches from `/api/zones/:athleteId` - combined power + HR zones with calculated values
- Power zones (6 zones, % of FTP): Z1 Recupero 0-55%, Z2 Resistenza 55-75%, Z3 Tempo 75-90%, Z4 Soglia 90-105%, Z5 VO2MAX 105-120%, Z6 Anaerobica 120-150%
- HR zones (5 zones, % of FC Soglia where FC Soglia = 93% of Max HR): Z1 <68%, Z2 68-83%, Z3 83-94%, Z4 94-105%, Z5 105-120%
- Used in AthleteStatsPage to display calculated training zones for coach view
- Zone systems: Power (COGGAN, POLARIZED, CUSTOM), HR (STANDARD, KARVONEN, CUSTOM)

**useTour** (`src/hooks/useTour.ts`)
```typescript
const {
  tourState,              // TourState | null
  isLoading,              // boolean
  shouldShowTour,         // boolean (not completed and not dismissed)
  shouldShowChecklist,    // boolean (has incomplete items)
  completeTour,           // () => Promise
  dismissTour,            // () => Promise
  completeChecklistItem,  // (itemId: ChecklistItemId) => Promise
  isItemCompleted,        // (itemId) => boolean
} = useTour({ autoFetch: true });
```
- Fetches tour state from `/api/users/me/tour`
- Manages guided tour for new athletes
- Tracks setup checklist completion (profile, availability, goals, assessment)
- Auto-fetches on mount by default

**useWorkoutUpload** (`src/hooks/useWorkoutUpload.ts`)
```typescript
const {
  uploadAndParse,       // (file: File) => Promise<ParsedWorkoutResult>
  uploadAndConvert,     // (file: File, options?) => Promise<ConvertedWorkout>
  parseContent,         // (content: string, format: SourceFormat) => Promise<ParsedWorkoutResult>
  convertContent,       // (content: string, format: SourceFormat, options?) => Promise<ConvertedWorkout>
  getSupportedFormats,  // () => Promise<string[]>
  reset,                // () => void - Reset all state
  isUploading,          // boolean
  isParsing,            // boolean
  isConverting,         // boolean
  error,                // Error | null
  parsedWorkout,        // ParsedWorkoutResult | null
  convertedWorkout,     // ConvertedWorkout | null
  supportedFormats,     // string[] (e.g., ['.zwo', '.erg', '.mrc'])
} = useWorkoutUpload();
```
- Upload workout files (.zwo, .erg, .mrc) from Zwift, TrainerRoad, etc.
- Two-step process: parse (preview) → convert (import)
- Converts to internal workout format compatible with the system
- Uses FormData for file uploads with Clerk authentication

### Workout Upload Types (`src/types/workoutUpload.ts`)
```typescript
interface ParsedWorkoutResult {
  name: string;
  author?: string;
  description?: string;
  sportType: 'cycling' | 'running';
  segments: ParsedSegment[];    // Parsed intervals
  totalDuration: number;        // Total duration in seconds
  sourceFormat: 'zwo' | 'erg' | 'mrc' | 'fit';
  ftp?: number;
}

interface ConvertedWorkout {
  name: string;
  slug: string;
  description: string;
  durationSeconds: number;
  tssPlanned: number;
  ifPlanned: number;
  workoutType: string;
  environment: 'INDOOR' | 'OUTDOOR' | 'ANY';
  intensity: 'EASY' | 'MODERATE' | 'HARD' | 'VERY_HARD';
  structure: unknown[];
  rawJson: Record<string, unknown>;
  sourceFormat: string;
}
```

## API Integration

Backend: NestJS API at `http://localhost:3001`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/week/:athleteId?weekStart=` | Get training week with scheduled workouts |
| POST | `/api/calendar/week` | Create training week |
| POST | `/api/calendar/scheduled` | Add workout to week |
| DELETE | `/api/calendar/scheduled/:id` | Remove scheduled workout |
| PUT | `/api/calendar/scheduled/:id` | Update scheduled workout (dayIndex, notes, completed, sortOrder) |
| PUT | `/api/calendar/scheduled/:id/complete` | Toggle completion |
| GET | `/api/calendar/coach/:coachId/dashboard` | Get coach dashboard (aggregated athlete stats) |
| GET | `/api/workouts` | List all workouts |
| GET | `/api/workouts/categories` | List workout categories |
| POST | `/api/workouts` | Create new workout |
| PUT | `/api/workouts/:id` | Update existing workout |
| GET | `/api/athlete-settings/:athleteId` | Get athlete availability & goals |
| GET | `/api/users/:id/public` | Get public user profile |
| GET | `/api/availability/:athleteId/notes` | Get availability notes |
| PUT | `/api/availability/:athleteId/notes` | Update availability notes |
| GET | `/api/availability/:athleteId/unavailable-dates` | Get unavailable dates |
| POST | `/api/availability/:athleteId/unavailable-dates/bulk` | Add multiple unavailable dates |
| DELETE | `/api/availability/:athleteId/unavailable-dates/:date` | Delete unavailable date by date |
| GET | `/api/onboarding/:athleteId/status` | Get onboarding status & current step |
| POST | `/api/onboarding/:athleteId/step/:stepNumber` | Save onboarding step data |
| POST | `/api/onboarding/:athleteId/complete` | Mark onboarding as complete |
| GET | `/api/onboarding/:athleteId/profile` | Get full athlete profile (for coach) |
| POST | `/api/assessments/start` | Start new 2-day assessment test |
| POST | `/api/assessments/:id/complete-day1` | Complete Day 1 (1'/2'/5' efforts) |
| POST | `/api/assessments/:id/start-day2` | Start Day 2 |
| POST | `/api/assessments/:id/complete-day2` | Complete Day 2 (5" sprint + 12' climb) |
| GET | `/api/assessments/athlete/:athleteId/ongoing` | Get ongoing test (in-progress) |
| GET | `/api/assessments/athlete/:athleteId` | Get all completed assessments |
| GET | `/api/assessments/athlete/:athleteId/latest` | Get latest completed assessment |
| GET | `/api/assessments/athlete/:athleteId/stats` | Get athlete stats with assessment data |
| GET | `/api/assessments/coach/:coachId/status` | Get assessment status for all athletes |
| GET | `/api/assessments/:id` | Get assessment by ID |
| DELETE | `/api/assessments/:id` | Delete assessment (in-progress only) |
| POST | `/api/assessments/check-expired` | Check and mark expired tests (background job) |
| GET | `/api/users/me/tour` | Get current user's tour state |
| PUT | `/api/users/me/tour` | Update tour state (completed/dismissed) |
| POST | `/api/users/me/tour/checklist/:itemId` | Complete a checklist item |
| POST | `/api/workout-parsers/upload` | Upload & parse workout file (returns ParsedWorkoutResult) |
| POST | `/api/workout-parsers/convert` | Upload & convert workout file (returns ConvertedWorkout) |
| POST | `/api/workout-parsers/parse` | Parse workout content string (body: { content, format }) |
| POST | `/api/workout-parsers/convert-content` | Convert workout content string (body: { content, format, options? }) |
| GET | `/api/workout-parsers/formats` | Get list of supported formats (.zwo, .erg, .mrc) |
| GET | `/api/zones/:athleteId` | Get all zones (power + HR) with calculated values based on FTP/maxHR |
| GET | `/api/zones/:athleteId/power` | Get power zones configuration |
| PUT | `/api/zones/:athleteId/power` | Update power zones (zoneSystem, zone1Max..zone6Max) |
| GET | `/api/zones/:athleteId/hr` | Get HR zones configuration |
| PUT | `/api/zones/:athleteId/hr` | Update HR zones (zoneSystem, zone1Max..zone5Max) |
| PUT | `/api/zones/:athleteId/data` | Update athlete's FTP, maxHR, restingHR |
| POST | `/api/zones/calculate/power` | Calculate power zones from FTP (without saving) |
| POST | `/api/zones/calculate/hr` | Calculate HR zones from maxHR (without saving) |

### API Client (`src/services/api.ts`)
```typescript
import { api } from '../services/api';
const data = await api.get<ResponseType>('/api/endpoint');
const result = await api.post<ResponseType>('/api/endpoint', body);
```

## Types

### Calendar Types (`src/types/calendar.ts`)

```typescript
interface ScheduledWorkout {
  id: string;
  workoutId: string;
  workout: Workout;
  dayIndex: number;      // 0=Monday, 6=Sunday
  sortOrder: number;
  completed: boolean;
}

interface DayColumn {
  dayIndex: number;
  date: Date;
  dayName: string;
  isToday: boolean;
  workouts: ScheduledWorkout[];
}
```

### Availability Types (`src/types/availability.ts`)

```typescript
interface DayAvailability {
  dayIndex: number;      // 0-6
  isAvailable: boolean;
  maxHours?: number;
  preferredTime?: 'morning' | 'afternoon' | 'evening';
  location?: 'indoor' | 'outdoor' | 'any';
}

interface Goal {
  id: string;
  name: string;
  date: string;
  priority: 'A' | 'B' | 'C';
  eventType?: string;
  targetDuration?: number;
  notes?: string;
}

// Specific dates when athlete is unavailable (vacations, travel, etc.)
interface UnavailableDate {
  id: string;
  date: Date;
  reason?: string;       // Optional reason like "Vacation", "Travel"
}

// Complete availability profile
interface AvailabilityProfile {
  weeklyAvailability: WeeklyAvailability;
  unavailableDates: UnavailableDate[];
  notes?: string;        // General notes about availability patterns
}
```

## Workout Builder

### WorkoutBuilderPage (`src/pages/WorkoutBuilderPage.tsx`)
- Two view modes: Structure (step-by-step) and Chart (visual preview)
- Persists workouts to API with loading state
- Auto-generates URL slug from title
- Calculates duration category (SHORT/MEDIUM/LONG)
- Navigates to edit page after creation

### WorkoutBuilder Component (`src/components/organisms/Coach/WorkoutBuilder.tsx`)
- Step-by-step workout structure builder
- Step types: warmUp, active, rest, coolDown, repetition
- Interval blocks with repeat count
- Category selector from API categories
- Real-time TSS/IF/duration estimation
- Props: `initialWorkout`, `onSave`, `onCancel`, `onChange`, `categories`, `isSaving`

## Workout Visualizer

### Data Flow

1. **Workout JSON** → Raw workout data with nested structure
2. **Parser** (`src/utils/parser.ts`) → Flattens to `FlatSegment[]` timeline
3. **WorkoutChart** → Renders segments as colored bars using visx

### Power Zone Colors (Coggan)

| Zone | % FTP | Color |
|------|-------|-------|
| Active Recovery | <55% | Gray/Blue |
| Endurance | 56-75% | Green |
| Tempo | 76-90% | Yellow |
| Threshold | 91-105% | Orange |
| VO2Max/Anaerobic | >105% | Red |

## Coach Dashboard & Invitations

### CoachPage (`src/pages/CoachPage.tsx`)
- Displays list of coach's athletes with relationship status
- Send email invitations to new athletes
- View pending/sent invitations
- Navigate to athlete calendar for workout assignment

### InvitationAcceptPage (`src/pages/InvitationAcceptPage.tsx`)
- Handles invitation acceptance flow
- Integrates with Clerk for new user signup
- Uses `__clerk_ticket` query param from Clerk invitation email
- States: loading, valid, expired, not_found, error, signing_up, accepted

### Clerk Integration
```typescript
import { useSignUp, useUser, useAuth } from '@clerk/clerk-react';

// Ticket signup strategy for invited users
const result = await signUp.create({
  strategy: 'ticket',
  ticket: clerkTicket,  // from URL ?__clerk_ticket=xxx
  firstName,
  lastName,
  password,
});
```

## Internationalization

Translations in `src/i18n/locales/{en,it}.json`

Key namespaces:
- `common.*` - Generic UI text
- `nav.*` - Navigation
- `calendar.*` - Calendar messages
- `library.*` - Workout library
- `settings.*` - Settings page
- `availability.*` - Availability config
- `goals.*` - Training goals
- `coach.*` - Coach athlete management
- `coachDashboard.*` - Coach dashboard overview page
- `invitation.*` - Invitation acceptance page
- `builder.*` - Workout builder
- `days.*` - Day abbreviations (mon, tue, etc.)
- `onboarding.*` - Onboarding wizard steps and fields
- `assessment.*` - Assessment tests (protocols, fields, units)
- `tour.*` - Guided tour and setup checklist
- `stats.*` - Athlete stats page (FTP, W/kg, assessment history)
- `workoutUpload.*` - Workout file import modal (upload, preview, customize steps)
- `zones.*` - Training zones (power zones, HR zones, zone names, calculations)

## MANDATORY: Documentation Maintenance

**CRITICAL**: After completing ANY feature, bug fix, or significant change, you MUST update the documentation:

### Required Updates

1. **`docs/FEATURES-AND-USER-JOURNEYS.md`** - Primary documentation file
   - Add new features to the appropriate section
   - Update business logic if changed
   - Add new user journeys for e2e testing
   - Update API endpoints if modified
   - Update data models if changed

2. **This file (`CLAUDE.md`)** - Technical reference
   - Update key routes if routes added/changed
   - Update hooks documentation if hooks modified
   - Update API endpoints table if changed
   - Update types if data structures changed

### What Triggers Documentation Updates

- New feature implementation
- API endpoint changes (add/modify/remove)
- New pages or routes
- Data model changes
- Business logic changes
- Bug fixes that affect user behavior
- UI/UX changes that affect user journeys

### Documentation Checklist

Before marking a task complete, verify:
- [ ] Feature documented in `docs/FEATURES-AND-USER-JOURNEYS.md`
- [ ] User journey added if it's a new flow
- [ ] API changes reflected in docs
- [ ] Types/data models documented
- [ ] i18n keys added to reference if new translations

### Example Documentation Update

When adding "Delete Workout" feature:
1. Add to "Coach Features > My Workouts Tab" section
2. Add "Journey 6: Coach Deletes Workout" user journey
3. Add DELETE endpoint to API table
4. Update test data requirements if needed

---

## Development Notes

### Week Handling
- Weeks start on Monday (weekStartsOn: 1)
- Day indices: 0=Monday through 6=Sunday
- Week dates formatted as ISO date strings for API (`yyyy-MM-dd`)

### Unavailable Days
- Fetched from athlete settings
- Displayed greyed out in calendar
- Block drag-drop and tap assignment
- Show warning toast if assignment attempted

### Mobile Support
- Responsive layouts using Chakra's useBreakpointValue
- Mobile calendar uses tabs (Library | Calendar)
- Tap-to-select workflow instead of drag-drop on mobile

## E2E Testing (Cypress)

### Running Tests

```bash
npx cypress run                    # Headless mode
npx cypress run --headed           # With browser window
npx cypress run --spec "cypress/e2e/user-roles.cy.ts"  # Specific test
npx cypress open                   # Interactive mode
```

### Clerk Authentication Setup

**IMPORTANT**: For Cypress E2E tests to work with Clerk authentication, you must configure the Clerk Dashboard:

1. Go to **Clerk Dashboard** → **User & Authentication** → **Password**
2. Find **"Client Trust"** setting
3. Set it to **OFF**

This disables the "new device verification" email that would otherwise block automated login.

### Test Credentials

```typescript
// cypress.config.ts
env: {
  testUserEmail: 'aacsyed@gmail.com',
  testUserPassword: 'RidePro25!',
}
```

### Authentication Flow

The tests use `cy.session()` with manual Clerk login:
- Visits app → enters email → clicks Continue
- Enters password → clicks Continue
- Waits for redirect away from sign-in pages
- Session cached across specs with `cacheAcrossSpecs: true`

See `cypress/support/e2e.ts` for the full login implementation.
