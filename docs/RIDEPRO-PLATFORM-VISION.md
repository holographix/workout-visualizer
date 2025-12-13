# RidePro Platform Vision & Technical Specification

> **Document Version:** 1.0
> **Last Updated:** December 2024
> **Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Core Differentiator](#the-core-differentiator)
3. [TrainingPeaks Feature Baseline](#trainingpeaks-feature-baseline)
4. [CEO's 8-Point Platform Structure](#ceos-8-point-platform-structure)
5. [User Onboarding Flow](#user-onboarding-flow)
6. [Early Adopter Feedback](#early-adopter-feedback)
7. [Technical Metrics & Formulas](#technical-metrics--formulas)
8. [Data Model Requirements](#data-model-requirements)
9. [Feature Prioritization Matrix](#feature-prioritization-matrix)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

RidePro is an AI-powered cycling training platform that aims to democratize access to World Tour-level coaching methodology. Unlike TrainingPeaks (a manual tool where coaches do all the thinking), RidePro encodes elite coach knowledge into algorithms that generate, adapt, and optimize training plans autonomously.

**Mission:** Enable one coach to effectively manage many more athletes while giving every cyclist access to professional, personalized, and flexible training plans.

---

## The Core Differentiator

> **"Non replicare TrainingPeaks, ma automatizzare il metodo dei coach del World Tour"**
>
> Not replicate TrainingPeaks, but **automate the World Tour coach methodology**

| Aspect | TrainingPeaks | RidePro |
|--------|---------------|---------|
| **Philosophy** | Tool for coaches | AI-powered coaching platform |
| **Plan creation** | 100% manual | Auto-generated with coach method |
| **Adaptation** | Coach must review & adjust | Self-adapting with oversight |
| **Athlete input** | Limited to notes | Chat + feedback → auto-modifications |
| **Data interpretation** | Charts for coach to read | AI explains + recommends |
| **Scaling** | 1 coach = limited athletes | 1 coach = many more athletes |
| **Cost model** | Coach time = money | AI does heavy lifting, coach supervises |

---

## TrainingPeaks Feature Baseline

This section documents TrainingPeaks features that serve as the baseline for RidePro, along with opportunities for improvement.

### Core Metrics System

#### Training Stress Score (TSS)

| Metric | Description | Formula |
|--------|-------------|---------|
| **TSS** | Training Stress Score - quantifies workout load | `TSS = (sec × NP × IF) / (FTP × 3600) × 100` |
| **IF** | Intensity Factor - relative workout intensity | 1.0 = threshold effort |
| **NP** | Normalized Power - weighted average for variability | Algorithm weights harder efforts more |
| **FTP** | Functional Threshold Power | Max sustainable power ~1 hour |

**TSS Rules:**
- 100 TSS = 1 hour at 100% FTP (maximum sustainable)
- Never more than 100 TSS per hour
- Accumulates over longer workouts (2hrs @ 50% IF = 100 TSS total)

#### Performance Management Chart (PMC)

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **CTL** | Chronic Training Load (Fitness) | 42-day rolling TSS average |
| **ATL** | Acute Training Load (Fatigue) | 7-day rolling TSS average |
| **TSB** | Training Stress Balance (Form) | CTL - ATL |

**TSB Interpretation:**
| TSB Range | Status | Purpose |
|-----------|--------|---------|
| +15 to +25 | Peak form | A-priority race day |
| -10 to +10 | Transitional | Tapering/recovery |
| -10 to -30 | Productive training | Base/build periods |
| Below -30 | Risk zone | Overtraining risk |

### Substrate Utilization / Fueling Insights

TrainingPeaks' advanced feature developed with Dr. Iñigo San-Millán.

**Input Variables:**
```typescript
interface FuelingInput {
  avgPower: number;           // From power meter
  weight: number;             // Athlete's weight (kg)
  gender: 'male' | 'female';
  metabolicProfile: 'world-class' | 'elite' | 'competitive' | 'enthusiast';
}
```

**Metabolic Profiles:**
| Profile | Description |
|---------|-------------|
| World-Class | Olympics, Tour de France |
| Elite | National/professional level |
| Competitive | Age-group with performance focus |
| Enthusiast | New to training, completion-focused |

**Output Metrics:**
- Carbohydrate Use (g/hr)
- Total Carbohydrate (g)
- Fat Use (g/hr)
- Total Fat (g)
- CHO Calories (carbs × 4 kcal)
- Fat Calories (fat × 9 kcal)

**Intensity vs Substrate:**
- Lower W/kg (Zone 2) → Higher fat oxidation, lower CHO
- Higher W/kg (Threshold+) → CHO dominates, fat nearly zero

### Structured Workout Format

```typescript
// Block Types (intensityClass)
type IntensityClass = 'warmUp' | 'active' | 'rest' | 'coolDown';

// Structure Types
type StructureType = 'step' | 'repetition';

// Target Specification
interface Target {
  minValue: number;  // % of FTP
  maxValue: number;
}

interface WorkoutStep {
  type?: 'step';
  name: string;
  length: { value: number; unit: 'second' | 'minute' };
  targets: Target[];
  intensityClass: IntensityClass;
  openDuration: boolean;  // Lap-button controlled
}
```

### TrainingPeaks Feature List

#### 1. Workout Import (.zwo files)

**Conversion Rules:**
- Warm Up/Cool Down in middle → Linear ramp block (stepwise, 1 step/min)
- Interval < 1 min → Split into 2 steps
- 0% FTP → Free-ride interval

**Custom Code Support:**
```
// Text events (athlete sees on screen)
!TextEvents:{
  0:FAST FEET!;
  15:Excellent work!;
}

// Resistance mode
!FlatRoad:{False}

// Max effort interval
!MaxEffort
```

#### 2. Strength Workout Builder

```typescript
interface StrengthWorkout {
  blocks: (SingleExercise | Superset | Circuit | WarmUp | CoolDown)[];
  workoutInstructions?: string;
}

interface SingleExercise {
  type: 'single';
  exerciseId: string;
  parameters: ExerciseParameter[];  // reps, weight, duration
  coachNotes?: string;
  videoUrl?: string;
}

interface Superset {
  type: 'superset';
  exercises: SingleExercise[];
  // Athletes CAN edit during workout
}

interface Circuit {
  type: 'circuit';
  exercises: SingleExercise[];
  // Athletes CANNOT edit - complete as block
}
```

#### 3. Custom Zones

```typescript
interface CustomZoneTemplate {
  id: string;
  methodName: string;          // e.g., "Coggan Classic", "Polarized 3-Zone"
  targetType: 'heartRate' | 'power' | 'pace';
  zones: {
    name: string;
    minPercent: number;
    maxPercent: number;
  }[];
}
```

**Behaviors:**
- Coaches create templates, apply to Premium athletes
- Can recalculate historical workouts with new zones
- Zones persist if athlete detaches from coach

#### 4. Recurring Workouts

```typescript
interface RecurrenceRule {
  repeatDays: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  repeatWeeks: number;
  endDate: Date;
  // Max: 90 days total
}
```

#### 5. Athlete Availability

```typescript
interface Availability {
  type: 'unavailable' | 'limited';
  dateRange: { start: Date; end: Date };
  reason?: string;
  description?: string;
  availableSportTypes?: SportType[];  // For 'limited' type only
}
```

#### 6. Notes System

```typescript
interface Note {
  id: string;
  title: string;               // Required
  description?: string;
  attachments?: Attachment[];  // 22MB limit
  comments: Comment[];
  isHiddenFromAthlete: boolean;
}
```

#### 7. Weather Integration

- 8-day forecast (today + 7 future)
- Location-based (coach and athlete can set different locations)
- OpenWeather API
- Premium only

#### 8. TSS Source Selection

Per-workout choice between:
- TSS (power-based)
- hrTSS (heart rate-based)
- rTSS (pace/running-based)

#### 9. Workout Library Sharing

- Share folders between coaches/athletes
- Recipients can't edit in-place
- Must copy to own folder to modify

### TrainingPeaks UX Pain Points (Opportunities)

| TP Pain Point | RidePro Opportunity |
|---------------|---------------------|
| Manual drag-and-drop to copy workouts | Bulk operations, keyboard shortcuts |
| Notes can't convert from 'Other' workouts | Flexible content type conversion |
| Custom zones can't be bulk-applied | Batch apply to athlete groups |
| No rich text in Notes | Markdown support |
| Weather only on web | Mobile weather integration |
| .zwo only for import | Support .fit, .erg, .mrc, JSON |
| 90-day recurring limit | Unlimited or template-based planning |
| Exercise history buried in modals | Dashboard view of progression |
| TSS source selection per-workout | Smart auto-detection + override |

---

## CEO's 8-Point Platform Structure

### 1. Coach Dashboard

Every coach has a dashboard with:
- List of athletes they manage
- Quick access to each athlete's calendar
- Personal workout library

**Enhancement over TP:** Smart sorting by athletes needing attention, hover previews.

### 2. Athlete Calendar

Clicking an athlete opens their weekly/monthly calendar where coach or system can:
- View scheduled workouts
- See completed activities (auto-colored)
- Auto-sync from Garmin, Strava, Wahoo
- Drag & drop modifications

**Enhancement over TP:** Smart rescheduling suggestions, rich visual feedback.

### 3. Workout Library

Coaches can:
- Create workouts via internal editor
- Save to personal library
- Reuse, modify, duplicate any workout
- Standardized format compatible for all coaches

**Enhancement over TP:** Universal compatibility, not just .zwo.

### 4. Automation of Coach Method (KEY INNOVATION)

```
TrainingPeaks: Coach manually plans → reviews data → manually adjusts

RidePro:
  Coach's methodology → Encoded into algorithms →
  AI generates plans → Auto-adapts based on data →
  Coach supervises/overrides
```

**What needs to be digitized:**
- Logical workout sequences (when to do what)
- Progressions (how to build up)
- Load/unload cycles (periodization)
- Objective-based modularity (gravel vs crit vs gran fondo)
- Level-based adaptations (beginner vs elite)

**Requires:** Deep collaboration with coaches to extract their methodology.

### 5. Data Analysis & Performance Panel

Over time, the platform provides advanced analysis where athletes see:
- Fitness progress
- Weekly/monthly/yearly trends
- Training zones
- Load, intensity, frequency
- Automatic comparisons over time

**Enhancement over TP:** AI-powered analysis with natural language insights, not just charts.

### 6. Automatic Plan Adaptation (KEY INNOVATION)

The plan adapts when the athlete requests it.

| Scenario | TrainingPeaks | RidePro |
|----------|---------------|---------|
| Move workout | Manual drag | Smart reschedule with load balancing |
| Feeling tired | Coach must adjust | Auto-reduce + suggest recovery |
| Feeling strong | Coach must adjust | Auto-increase load opportunistically |
| Missed workout | Lost or manual fix | Auto-redistribute critical sessions |
| Illness | Coach rebuilds | Return-to-training protocol |

**Goal:** System understands requests and applies modifications coherently with coach methodology.

### 7. Intelligent Chat (Future)

Athletes can:
- Report problems (tiredness, illness, commitments)
- Request modifications
- Receive motivation and advice
- Get explanations about workouts

Chat connected to AI to auto-update calendar or provide useful feedback.

### 8. Final Platform Goals

```
┌─────────────────────────────────────────────────────────────┐
│                    RidePro = Combines                        │
├─────────────────────────────────────────────────────────────┤
│  TrainingPeaks Simplicity  +  World Tour Method Automation  │
│  Human Coach Adaptability  +  AI Platform Intelligence      │
└─────────────────────────────────────────────────────────────┘
```

**Outcomes:**
- Coach manages more athletes in less time
- Cyclist gets professional, personalized, flexible plan

---

## User Onboarding Flow

### Step 1: Login/Registration
- Email + password
- Social login (future phase)

### Step 2: Choose Coach
- Determines training method, progressions, personalized schemes
- Can be changed later

### Step 3: Payment
- Subscription activated
- Triggers onboarding flow

### Step 4: Personal Information
| Field | Type | Required |
|-------|------|----------|
| Sex | Select | Yes |
| Age / Date of birth | Date | Yes |
| Height | Number (cm) | Yes |
| Weight | Number (kg) | Yes |
| Experience level | Beginner/Intermediate/Advanced | Yes |
| HRM available | Boolean | Yes |
| Power meter available | Boolean | Yes |

### Step 5: Performance Data (Optional)
| Field | Type | Fallback |
|-------|------|----------|
| FTP (or estimate) | Number (watts) | Borg scale |
| HR max | Number (bpm) | Estimate from age |
| HR min | Number (bpm) | - |
| Threshold HR | Number (bpm) | - |
| VO2Max | Number (ml/kg/min) | - |

If unknown → Platform uses Borg scale (perceived exertion) initially.

### Step 6: Weekly Availability
| Field | Type |
|-------|------|
| Days available per week | Multi-select |
| Time per day | Duration per day |
| Fixed vs flexible days | Toggle per day |

### Step 7: Goal Definition

**With Races:**
| Priority | Description |
|----------|-------------|
| Race A | Main season objective (at least one) |
| Race B | Secondary, important but not priority |
| Race C | Supporting races/tests |

**Without Races:**
- Improve endurance
- Improve explosivity
- General fitness improvement
- Weight loss
- General fitness

### Step 8: Week 1 - Adaptation Week
Auto-generated based on:
- Performance values (if provided) → Use zones directly
- No performance values → Use Borg scale

Goal: Gradual body adaptation and structure for tests.

### Step 9: Week 2 - CP Tests

| Test | Duration | Measures |
|------|----------|----------|
| CP 5" | 5 seconds | Neuromuscular power |
| CP 1' | 1 minute | Anaerobic capacity |
| CP 2' | 2 minutes | Anaerobic capacity |
| CP 5' | 5 minutes | VO2max |
| CP 12' | 12 minutes | Threshold |

**Results automatically calculate:**
- Power zones
- Heart rate zones
- Perceived exertion zones
- Derived performance indicators

### Step 10: Week 3+ - Personalized Program

Generated working backwards from Race A (up to 24 weeks):
- Load progressions
- Deload periods
- Objective-specific work (gravel, XC, granfondo, etc.)
- Based on declared availability

**Ongoing:**
- Data analysis
- Weekly adaptations
- Re-programming as needed

---

## Early Adopter Feedback

### Problems Identified During Beta

| # | Problem | Impact | Solution |
|---|---------|--------|----------|
| 1 | **Insufficient personalization** | Users felt plans weren't truly customized | Deep onboarding + continuous adaptation based on feedback |
| 2 | **Confusing UX/Navigation** | Hard to navigate weeks, poor orientation | Clean calendar UI, clear week indicators, better onboarding |
| 3 | **Technical instability** | Login issues, slow loading, bugs | Solid backend architecture, proper caching, error handling |
| 4 | **No dynamic adaptation** | No feedback loop after workouts | Post-workout feedback → auto-adjust, visible modifications |
| 5 | **Limited coach tools** | Dashboard too basic | Full coach dashboard with automation and communication |
| 6 | **Method value unclear** | Users didn't understand what made it special | Explain AI decisions, show methodology, educate users |
| 7 | **No user control** | Couldn't modify own plan | Self-service modifications with smart guardrails |
| 8 | **Missing integrations** | No Garmin/Strava/Wahoo sync | Priority integration with major platforms |

---

## Technical Metrics & Formulas

### TSS Calculation
```
TSS = (duration_seconds × NP × IF) / (FTP × 3600) × 100
```

### Intensity Factor
```
IF = NP / FTP
```

### Normalized Power (simplified)
```
NP = 4th root of (average of rolling 30s power^4)
```

### CTL (Fitness)
```
CTL_today = CTL_yesterday + (TSS_today - CTL_yesterday) / 42
```

### ATL (Fatigue)
```
ATL_today = ATL_yesterday + (TSS_today - ATL_yesterday) / 7
```

### TSB (Form)
```
TSB = CTL - ATL
```

### Fueling (Substrate Utilization)
Based on Dr. San-Millán's research:
- Carbohydrate oxidation: Sigmoidal curve based on W/kg
- Fat oxidation: Parabolic curve based on W/kg
- Both are sex- and performance-profile specific

### Threshold Tests

| Test | Protocol | Calculation |
|------|----------|-------------|
| 20-min FTP | Max 20 minutes | FTP = Avg Power × 0.95 |
| 30-min FTP | Max 30 minutes | FTP = Avg Power |
| 8-min FTP | 2 × 8 min max, 10 min rest | FTP = Higher Avg × 0.90 |
| Ramp Test | +1W/min to exhaustion | FTP = Peak 1-min × 0.75 |

---

## Data Model Requirements

### Core Entities

```prisma
// User & Authentication
model User {
  id            String   @id @default(uuid())
  clerkUserId   String   @unique
  email         String   @unique
  fullName      String?
  avatarUrl     String?
  role          Role     @default(ATHLETE)

  // Relations
  athleteProfile  AthleteProfile?
  coachProfile    CoachProfile?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Role {
  ATHLETE
  COACH
  ADMIN
}

// Athlete Profile
model AthleteProfile {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])

  // Personal Info
  sex               Sex
  dateOfBirth       DateTime
  height            Float    // cm
  weight            Float    // kg
  experienceLevel   ExperienceLevel

  // Equipment
  hasHRM            Boolean  @default(false)
  hasPowerMeter     Boolean  @default(false)

  // Performance Data
  ftp               Int?     // watts
  lthr              Int?     // bpm
  hrMax             Int?     // bpm
  hrMin             Int?     // bpm
  vo2Max            Float?   // ml/kg/min

  // Metabolic Profile
  metabolicProfile  MetabolicProfile @default(COMPETITIVE)

  // Zones (JSON for flexibility)
  powerZones        Json?
  hrZones           Json?
  rpeZones          Json?

  // Coach Assignment
  coachId           String?
  coach             CoachProfile? @relation(fields: [coachId], references: [id])

  // Relations
  availability      Availability[]
  scheduledWorkouts ScheduledWorkout[]
  completedWorkouts CompletedWorkout[]
  goals             Goal[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum Sex {
  MALE
  FEMALE
}

enum ExperienceLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum MetabolicProfile {
  WORLD_CLASS
  ELITE
  COMPETITIVE
  ENTHUSIAST
}

// Coach Profile
model CoachProfile {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])

  // Coach Info
  bio               String?
  specializations   String[]
  methodology       Json?    // Encoded training methodology

  // Relations
  athletes          AthleteProfile[]
  workoutLibrary    WorkoutTemplate[]
  customZones       CustomZoneTemplate[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Workout Template (Library)
model WorkoutTemplate {
  id                String   @id @default(uuid())
  coachId           String?
  coach             CoachProfile? @relation(fields: [coachId], references: [id])

  // Workout Info
  title             String
  description       String?
  workoutType       WorkoutType
  sport             Sport    @default(CYCLING)

  // Metrics
  plannedTSS        Float?
  plannedIF         Float?
  plannedDuration   Int      // seconds

  // Structure (JSON for flexibility)
  structure         Json     // Full workout structure

  // Categorization
  category          String?  // e.g., "anaerobic-capacity", "vo2max"
  tags              String[]

  // Library Organization
  folderId          String?
  isPublic          Boolean  @default(false)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum WorkoutType {
  ENDURANCE
  TEMPO
  THRESHOLD
  VO2MAX
  ANAEROBIC
  SPRINT
  RECOVERY
  TEST
  STRENGTH
}

enum Sport {
  CYCLING
  RUNNING
  SWIMMING
  STRENGTH
  OTHER
}

// Scheduled Workout (on calendar)
model ScheduledWorkout {
  id                String   @id @default(uuid())
  athleteId         String
  athlete           AthleteProfile @relation(fields: [athleteId], references: [id])

  workoutTemplateId String?
  workoutTemplate   WorkoutTemplate? @relation(fields: [workoutTemplateId], references: [id])

  // Schedule
  scheduledDate     DateTime
  timeOfDay         TimeOfDay?

  // Planned values (may differ from template if modified)
  plannedTSS        Float?
  plannedIF         Float?
  plannedDuration   Int?     // seconds
  plannedStructure  Json?

  // Coach notes for this specific instance
  coachNotes        String?

  // Status
  status            ScheduledWorkoutStatus @default(PLANNED)

  // Completion link
  completedWorkout  CompletedWorkout?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum TimeOfDay {
  MORNING
  AFTERNOON
  EVENING
  FLEXIBLE
}

enum ScheduledWorkoutStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  SKIPPED
  MODIFIED
}

// Completed Workout (actual data)
model CompletedWorkout {
  id                  String   @id @default(uuid())
  athleteId           String
  athlete             AthleteProfile @relation(fields: [athleteId], references: [id])

  scheduledWorkoutId  String?  @unique
  scheduledWorkout    ScheduledWorkout? @relation(fields: [scheduledWorkoutId], references: [id])

  // Actual values
  completedAt         DateTime
  actualDuration      Int      // seconds
  actualTSS           Float?
  actualIF            Float?
  actualNP            Float?   // Normalized Power
  actualAvgPower      Float?
  actualMaxPower      Float?
  actualAvgHR         Float?
  actualMaxHR         Float?
  actualCalories      Float?
  actualDistance      Float?   // meters

  // Fueling data
  carbCalories        Float?
  fatCalories         Float?

  // Athlete feedback
  perceivedEffort     Int?     // 1-10 RPE
  feelingBefore       Int?     // 1-5
  feelingAfter        Int?     // 1-5
  athleteNotes        String?

  // Compliance
  compliancePercent   Float?   // Actual vs Planned

  // External data source
  externalSource      ExternalSource?
  externalId          String?
  rawData             Json?    // Full FIT/GPX data

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

enum ExternalSource {
  GARMIN
  STRAVA
  WAHOO
  MANUAL
}

// Availability
model Availability {
  id                String   @id @default(uuid())
  athleteId         String
  athlete           AthleteProfile @relation(fields: [athleteId], references: [id])

  type              AvailabilityType
  startDate         DateTime
  endDate           DateTime
  reason            String?
  description       String?
  availableSports   Sport[]  // For LIMITED type

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum AvailabilityType {
  UNAVAILABLE
  LIMITED
}

// Goals
model Goal {
  id                String   @id @default(uuid())
  athleteId         String
  athlete           AthleteProfile @relation(fields: [athleteId], references: [id])

  title             String
  description       String?
  targetDate        DateTime?
  priority          GoalPriority
  goalType          GoalType

  // For race goals
  raceDistance      Float?   // km
  raceElevation     Float?   // meters
  raceType          String?  // granfondo, crit, XC, etc.

  status            GoalStatus @default(ACTIVE)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum GoalPriority {
  A  // Main objective
  B  // Secondary
  C  // Supporting
}

enum GoalType {
  RACE
  ENDURANCE
  POWER
  WEIGHT_LOSS
  GENERAL_FITNESS
  CUSTOM
}

enum GoalStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}

// Notes
model Note {
  id                  String   @id @default(uuid())
  athleteId           String
  authorId            String

  title               String
  description         String?
  date                DateTime
  attachments         Json?    // [{url, filename, size}]
  isHiddenFromAthlete Boolean  @default(false)

  comments            NoteComment[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model NoteComment {
  id                String   @id @default(uuid())
  noteId            String
  note              Note     @relation(fields: [noteId], references: [id])
  authorId          String
  content           String

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Custom Zone Templates
model CustomZoneTemplate {
  id                String   @id @default(uuid())
  coachId           String
  coach             CoachProfile @relation(fields: [coachId], references: [id])

  name              String
  targetType        ZoneTargetType
  zones             Json     // Array of {name, minPercent, maxPercent}

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum ZoneTargetType {
  POWER
  HEART_RATE
  PACE
}

// Training Week (for periodization tracking)
model TrainingWeek {
  id                String   @id @default(uuid())
  athleteId         String

  weekStart         DateTime
  weekNumber        Int
  phase             TrainingPhase

  // Planned
  plannedTSS        Float
  plannedHours      Float

  // Actual (calculated from completed workouts)
  actualTSS         Float?
  actualHours       Float?

  // PMC values at week end
  ctlEnd            Float?
  atlEnd            Float?
  tsbEnd            Float?

  notes             String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum TrainingPhase {
  ADAPTATION
  TESTING
  BASE
  BUILD
  PEAK
  TAPER
  RACE
  RECOVERY
  TRANSITION
}
```

---

## Feature Prioritization Matrix

### Priority Levels

| Priority | Description | Timeline |
|----------|-------------|----------|
| P0 | Core MVP - Must have for launch | Immediate |
| P1 | Essential - Needed shortly after launch | Short-term |
| P2 | Important - Significant value add | Medium-term |
| P3 | Nice to have - Future enhancement | Long-term |

### Feature Matrix

| Feature | Priority | Complexity | Value | Dependencies |
|---------|----------|------------|-------|--------------|
| **Authentication (Clerk)** | P0 | Low | High | None |
| **User/Athlete Profiles** | P0 | Medium | High | Auth |
| **Workout Library (view)** | P0 | Low | High | None |
| **Calendar View** | P0 | Medium | High | Profiles |
| **Workout Visualization** | P0 | Done | High | None |
| **Coach Dashboard** | P0 | Medium | High | Profiles |
| **Scheduled Workouts** | P0 | Medium | High | Calendar, Library |
| **Workout Completion (manual)** | P0 | Medium | High | Scheduled |
| **Onboarding Flow** | P1 | Medium | High | Profiles |
| **Goal Setting** | P1 | Low | Medium | Profiles |
| **Availability** | P1 | Low | Medium | Calendar |
| **CP Testing Protocol** | P1 | Medium | High | Workouts |
| **Zone Calculation** | P1 | Medium | High | Testing |
| **TSS/IF Calculation** | P1 | Medium | High | Zones |
| **PMC Charts** | P1 | Medium | High | TSS |
| **Garmin Integration** | P1 | High | High | Completed Workouts |
| **Strava Integration** | P1 | High | High | Completed Workouts |
| **Plan Generation (basic)** | P1 | High | Critical | All P0 |
| **Drag & Drop Calendar** | P2 | Medium | Medium | Calendar |
| **Notes System** | P2 | Low | Medium | Profiles |
| **Recurring Workouts** | P2 | Medium | Medium | Scheduled |
| **Custom Zones** | P2 | Medium | Medium | Zones |
| **Workout Builder** | P2 | High | High | Library |
| **Plan Adaptation (basic)** | P2 | High | High | Plan Gen |
| **Compliance Tracking** | P2 | Medium | High | Completed |
| **Post-Workout Feedback** | P2 | Low | High | Completed |
| **Strength Workouts** | P3 | High | Medium | Builder |
| **Fueling Insights** | P3 | High | Medium | Profiles |
| **Intelligent Chat** | P3 | Very High | High | All |
| **Weather Integration** | P3 | Low | Low | Calendar |
| **Wahoo Integration** | P3 | High | Medium | Completed |
| **Mobile App** | P3 | Very High | High | All |

---

## Implementation Roadmap

### Phase 0: Foundation (Current)
- [x] Project setup (React + Vite + TypeScript)
- [x] Workout visualization component
- [x] Workout library (static JSON)
- [x] Basic Clerk authentication
- [x] NestJS API scaffold
- [x] Prisma + Supabase setup
- [ ] Complete Prisma schema with all models
- [ ] Basic CRUD endpoints

### Phase 1: Core MVP
- [ ] Complete onboarding flow
- [ ] Athlete profile management
- [ ] Coach dashboard (basic)
- [ ] Calendar view with scheduled workouts
- [ ] Manual workout completion
- [ ] Basic TSS/IF display

### Phase 2: Data & Intelligence
- [ ] Garmin Connect integration
- [ ] Strava integration
- [ ] Auto-sync completed activities
- [ ] Zone calculation from tests
- [ ] PMC chart (CTL/ATL/TSB)
- [ ] Compliance tracking

### Phase 3: Plan Generation
- [ ] Goal-based plan structure
- [ ] Coach methodology encoding
- [ ] Backward planning from Race A
- [ ] Load/deload periodization
- [ ] Weekly plan generation

### Phase 4: Adaptation
- [ ] Post-workout feedback collection
- [ ] Basic plan modifications
- [ ] Missed workout redistribution
- [ ] Load adjustment based on feedback

### Phase 5: Advanced Features
- [ ] Workout builder
- [ ] Custom zones
- [ ] Notes system
- [ ] Recurring workouts
- [ ] Library sharing

### Phase 6: AI & Intelligence
- [ ] Natural language insights
- [ ] Intelligent chat
- [ ] Proactive recommendations
- [ ] Automatic adaptations

### Phase 7: Polish & Scale
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Fueling insights
- [ ] Strength integration
- [ ] Multi-language support

---

## Appendix: Workout Categories

Current workout library categories:

| Category | Training Focus | Example Workouts |
|----------|---------------|------------------|
| anaerobic-capacity | Short max sprints (10-30s) | 8x10" SRT |
| vo2max | High-intensity intervals (3-5min @ 105-120% FTP) | 5x5' @ 105% |
| strength | Force-based work, low cadence | SFR intervals |
| racepace | Competition simulation | Race-specific efforts |
| fatmax | Long zone 2 endurance | 3-4hr steady |
| easy-ride | Active recovery | Easy spin |
| resistence | Sustained threshold work | 2x20' @ FTP |
| muscolar-elasticity | Cadence/spin drills | High RPM intervals |
| warmup | Pre-workout protocols | Progressive warm-up |
| test | FTP/threshold testing | 20' FTP test |
| activaction | Activation/priming | Pre-race opener |
| riposo | Rest day | - |

---

## Action Plan - What's On The Menu

> **Approved:** December 2024
> **Status:** Ready for Implementation

### Immediate Next Steps (This Sprint)

#### 1. Complete Prisma Schema
- [ ] Add all models from Data Model Requirements section
- [ ] Run migration to Supabase
- [ ] Generate Prisma client
- [ ] Create seed data for testing

#### 2. Backend API Endpoints (NestJS)

**User & Profile Module:**
- [ ] `GET /api/users/me` - Current user profile ✅ (exists)
- [ ] `PUT /api/users/me` - Update profile
- [ ] `POST /api/users/onboarding` - Complete onboarding
- [ ] `GET /api/users/:id/profile` - Get athlete/coach profile

**Workout Library Module:**
- [ ] `GET /api/workouts` - List all workouts (with filters)
- [ ] `GET /api/workouts/:id` - Get single workout
- [ ] `GET /api/workouts/categories` - List categories
- [ ] `POST /api/workouts` - Create workout (coach)
- [ ] `PUT /api/workouts/:id` - Update workout
- [ ] `DELETE /api/workouts/:id` - Delete workout

**Calendar Module:**
- [ ] `GET /api/calendar` - Get scheduled workouts (date range)
- [ ] `POST /api/calendar/schedule` - Schedule a workout
- [ ] `PUT /api/calendar/:id` - Move/modify scheduled workout
- [ ] `DELETE /api/calendar/:id` - Remove from calendar

**Completion Module:**
- [ ] `POST /api/workouts/:id/complete` - Mark workout complete
- [ ] `PUT /api/completed/:id` - Update completion data
- [ ] `GET /api/completed` - List completed workouts

**Goals Module:**
- [ ] `GET /api/goals` - List athlete goals
- [ ] `POST /api/goals` - Create goal
- [ ] `PUT /api/goals/:id` - Update goal
- [ ] `DELETE /api/goals/:id` - Delete goal

**Availability Module:**
- [ ] `GET /api/availability` - List availability
- [ ] `POST /api/availability` - Create availability
- [ ] `PUT /api/availability/:id` - Update
- [ ] `DELETE /api/availability/:id` - Delete

#### 3. Frontend Pages (React)

**Core Pages:**
- [ ] `/onboarding` - Multi-step onboarding wizard
- [ ] `/dashboard` - Athlete dashboard (calendar + stats)
- [ ] `/coach` - Coach dashboard (athlete list)
- [ ] `/library` - Workout library browser
- [ ] `/calendar` - Full calendar view
- [ ] `/profile` - Profile settings

**Components Needed:**
- [ ] `OnboardingWizard` - Step-by-step form
- [ ] `AthleteCard` - For coach's athlete list
- [ ] `CalendarView` - Week/month calendar
- [ ] `ScheduledWorkoutCard` - Calendar item
- [ ] `WorkoutCompletionModal` - Record completion
- [ ] `GoalEditor` - Create/edit goals
- [ ] `AvailabilityEditor` - Set availability
- [ ] `ProfileForm` - Edit profile data

---

### Phase-by-Phase Breakdown

#### Phase 1: Core MVP (Target: 2-3 weeks)

| Task | Backend | Frontend | Priority |
|------|---------|----------|----------|
| Prisma schema complete | ✓ | - | P0 |
| User profiles CRUD | ✓ | ✓ | P0 |
| Onboarding flow | ✓ | ✓ | P0 |
| Workout library API | ✓ | ✓ | P0 |
| Calendar view | ✓ | ✓ | P0 |
| Schedule workouts | ✓ | ✓ | P0 |
| Manual completion | ✓ | ✓ | P0 |
| Coach dashboard | ✓ | ✓ | P0 |

**Definition of Done:**
- Coach can view athlete list
- Coach can view athlete calendar
- Coach can schedule workouts from library
- Athlete can see scheduled workouts
- Athlete can mark workouts complete (manual entry)

---

#### Phase 2: Data & Intelligence (Target: 2-3 weeks)

| Task | Backend | Frontend | Priority |
|------|---------|----------|----------|
| Garmin OAuth integration | ✓ | ✓ | P1 |
| Strava OAuth integration | ✓ | ✓ | P1 |
| Activity sync service | ✓ | - | P1 |
| Auto-match to scheduled | ✓ | - | P1 |
| TSS/IF calculation | ✓ | ✓ | P1 |
| Zone calculation | ✓ | ✓ | P1 |
| PMC chart component | - | ✓ | P1 |
| Compliance display | ✓ | ✓ | P1 |

**Definition of Done:**
- Activities auto-sync from Garmin/Strava
- TSS calculated for each activity
- PMC chart shows CTL/ATL/TSB
- Compliance % shown for completed workouts

---

#### Phase 3: Plan Generation (Target: 3-4 weeks)

| Task | Backend | Frontend | Priority |
|------|---------|----------|----------|
| Goal-based periodization | ✓ | - | P1 |
| Coach methodology encoding | ✓ | - | P1 |
| Backward planning algorithm | ✓ | - | P1 |
| Load/deload cycles | ✓ | - | P1 |
| Weekly plan generator | ✓ | - | P1 |
| Plan preview UI | - | ✓ | P1 |
| Plan approval flow | ✓ | ✓ | P1 |

**Definition of Done:**
- System generates training plan from goals
- Plan respects athlete availability
- Load progressions and deloads included
- Coach can review/modify before publishing

---

#### Phase 4: Adaptation (Target: 2 weeks)

| Task | Backend | Frontend | Priority |
|------|---------|----------|----------|
| Post-workout feedback form | ✓ | ✓ | P2 |
| Feedback analysis service | ✓ | - | P2 |
| Basic plan modifications | ✓ | ✓ | P2 |
| Missed workout handling | ✓ | - | P2 |
| Load adjustment rules | ✓ | - | P2 |

**Definition of Done:**
- Athlete can submit RPE + notes after workout
- System suggests modifications based on feedback
- Missed workouts trigger redistribution options

---

#### Phase 5: Advanced Features (Target: 3 weeks)

| Task | Backend | Frontend | Priority |
|------|---------|----------|----------|
| Workout builder | ✓ | ✓ | P2 |
| Drag & drop calendar | - | ✓ | P2 |
| Notes system | ✓ | ✓ | P2 |
| Custom zones | ✓ | ✓ | P2 |
| Recurring workouts | ✓ | ✓ | P2 |
| Library sharing | ✓ | ✓ | P2 |

---

#### Phase 6: AI & Intelligence (Target: 4+ weeks)

| Task | Backend | Frontend | Priority |
|------|---------|----------|----------|
| Natural language insights | ✓ | ✓ | P3 |
| Intelligent chat | ✓ | ✓ | P3 |
| Proactive recommendations | ✓ | ✓ | P3 |
| Automatic adaptations | ✓ | - | P3 |

---

#### Phase 7: Polish & Scale (Ongoing)

| Task | Backend | Frontend | Priority |
|------|---------|----------|----------|
| Mobile app (React Native) | - | ✓ | P3 |
| Advanced analytics | ✓ | ✓ | P3 |
| Fueling insights | ✓ | ✓ | P3 |
| Strength workouts | ✓ | ✓ | P3 |
| Multi-language (i18n) | - | ✓ | P3 |
| Wahoo integration | ✓ | ✓ | P3 |

---

### Tech Stack Confirmed

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Chakra UI (dark/light mode) |
| **Charts** | visx (D3 wrapper) |
| **Calendar** | @dnd-kit (drag & drop) |
| **State** | React Query + Zustand |
| **Auth** | Clerk |
| **Backend** | NestJS + TypeScript |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 7 |
| **API** | REST (GraphQL later if needed) |
| **Hosting** | Vercel (FE) + Railway/Render (BE) |

---

## Architecture Decision: Web + Mobile Strategy

> **Decision Date:** December 2024
> **Decision:** Option A - Web-first with shared core, mobile later

### Context

RidePro needs both web and mobile apps:
- **Coach dashboard** → Web-heavy (complex tables, drag-drop, charts)
- **Athlete experience** → Mobile-heavy (quick logging, viewing workouts)
- **Current priority** → Ship web MVP fast
- **Mobile timeline** → 6+ months out

### Options Evaluated

| Approach | Web Quality | Mobile Quality | Code Sharing | Effort |
|----------|-------------|----------------|--------------|--------|
| React Web + React Native (separate) | Excellent | Excellent | ~30% | 2x |
| React Native + react-native-web | Good | Excellent | ~90% | 1.2x |
| Expo + Tamagui (universal) | Very Good | Excellent | ~95% | 1.1x |
| Flutter | Good | Excellent | 100% | 1x (new lang) |

### Decision: Web-first with Shared Core

**Chosen approach:** Build excellent web app with React + Chakra UI now. When mobile is needed, build React Native app that shares business logic.

**Why:**
1. Web needs to be excellent for coach dashboard
2. Chakra UI provides polished, accessible components
3. Faster time to MVP
4. 40-50% code reuse possible via shared packages
5. This is what TrainingPeaks, Strava, and most mature products do

### Monorepo Structure (Future-Ready)

```
/ridepro-monorepo
├── /packages
│   ├── /core                 # Shared business logic (40-50% of code)
│   │   ├── api/              # API clients (fetch, axios)
│   │   ├── hooks/            # useWorkout, useAuth, useCalendar
│   │   ├── types/            # TypeScript interfaces
│   │   ├── utils/            # TSS calculators, formatters, zone logic
│   │   ├── stores/           # Zustand state stores
│   │   └── constants/        # Zone colors, workout types, etc.
│   │
│   ├── /ui-web               # Web-specific UI (Chakra UI)
│   │   └── components/       # Atomic Design structure
│   │       ├── atoms/
│   │       ├── molecules/
│   │       ├── organisms/
│   │       └── templates/
│   │
│   └── /ui-mobile            # Mobile UI (React Native) - FUTURE
│       └── components/       # Same Atomic structure
│           ├── atoms/
│           ├── molecules/
│           ├── organisms/
│           └── templates/
│
├── /apps
│   ├── /web                  # Vite + React web app
│   │   ├── src/
│   │   │   ├── pages/        # Route pages
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   └── /mobile               # Expo React Native - FUTURE
│       ├── app/
│       └── package.json
│
└── /api                      # NestJS backend (existing ridepro-api)
    └── src/
```

### What Goes in `/packages/core` (Shared)

This is where **40-50% of the codebase** lives and is shared between web and mobile:

```typescript
// @ridepro/core - shared across platforms

// API clients
export { apiClient, useApi } from './api';
export { workoutApi, calendarApi, userApi } from './api/endpoints';

// Custom hooks (platform-agnostic)
export { useWorkout, useWorkoutLibrary } from './hooks/useWorkout';
export { useCalendar, useScheduledWorkouts } from './hooks/useCalendar';
export { useAuth, useUser } from './hooks/useAuth';
export { usePMC, useTSS } from './hooks/useMetrics';

// TypeScript types
export type { Workout, ParsedWorkout, FlatSegment } from './types/workout';
export type { User, AthleteProfile, CoachProfile } from './types/user';
export type { ScheduledWorkout, CompletedWorkout } from './types/calendar';

// Utilities
export { parseWorkout, flattenStructure } from './utils/parser';
export { calculateTSS, calculateIF, calculateNP } from './utils/metrics';
export { formatDuration, formatDate, formatPower } from './utils/formatters';
export { getZoneColor, getZoneName } from './utils/zones';

// State stores
export { useWorkoutStore } from './stores/workoutStore';
export { useCalendarStore } from './stores/calendarStore';
export { useUserStore } from './stores/userStore';

// Constants
export { ZONE_COLORS, WORKOUT_TYPES, INTENSITY_CLASSES } from './constants';
```

### Component Architecture: Atomic Design

Following Brad Frost's Atomic Design methodology:

```
/packages/ui-web/components/
├── atoms/                    # Basic building blocks
│   ├── Logo.tsx
│   ├── ZoneBadge.tsx
│   ├── StatValue.tsx
│   ├── IconLabel.tsx
│   ├── ColorModeToggle.tsx
│   └── index.ts
│
├── molecules/                # Combinations of atoms
│   ├── StatCard.tsx          # Icon + Label + Value
│   ├── IntervalRow.tsx       # ZoneBadge + Name + Duration + Target
│   ├── WorkoutPreview.tsx    # Title + TSS + Duration mini-card
│   ├── SearchInput.tsx       # Input + Icon
│   ├── UserAvatar.tsx        # Avatar + Name + Role
│   └── index.ts
│
├── organisms/                # Complex, standalone sections
│   ├── Header.tsx            # Logo + Nav + Actions + UserMenu
│   ├── WorkoutChart.tsx      # Full chart with legend
│   ├── IntervalList.tsx      # List of IntervalRows
│   ├── StatsGrid.tsx         # Grid of StatCards
│   ├── WorkoutLibrary.tsx    # Search + Categories + Workouts
│   ├── CalendarDay.tsx       # Day header + Workouts
│   ├── AthleteCard.tsx       # Avatar + Stats + Actions
│   └── index.ts
│
├── templates/                # Page layouts (no data)
│   ├── DashboardLayout.tsx   # Sidebar + Main + Header
│   ├── AuthLayout.tsx        # Centered card layout
│   ├── CalendarLayout.tsx    # Week/month grid layout
│   ├── OnboardingLayout.tsx  # Step wizard layout
│   └── index.ts
│
└── index.ts                  # Barrel export
```

### Migration Path to Mobile

When mobile development starts (Phase 7+):

1. **Extract shared logic** to `@ridepro/core` package
2. **Create Expo app** in `/apps/mobile`
3. **Build native components** in `/packages/ui-mobile` following same Atomic structure
4. **Import from core:** `import { useWorkout, calculateTSS } from '@ridepro/core'`
5. **Only UI is different** - all business logic, API calls, state is shared

**Estimated mobile development time with this architecture:** 3-4 weeks for MVP (vs 8-10 weeks without shared code)

### Current Implementation (Pre-Monorepo)

Until we need the full monorepo structure, we'll organize the current codebase to be monorepo-ready:

```
/TrainingPeaks-visualizer (current)
├── src/
│   ├── components/           # Atomic Design structure
│   │   ├── atoms/
│   │   ├── molecules/
│   │   ├── organisms/
│   │   └── templates/
│   │
│   ├── core/                 # Future @ridepro/core content
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── stores/
│   │   └── constants/
│   │
│   ├── pages/                # Route pages
│   ├── theme/                # Chakra UI theme
│   └── main.tsx
```

This structure makes future extraction to monorepo trivial - just move `/src/core` to `/packages/core`.

---

### Success Metrics

| Metric | Phase 1 Target | Phase 3 Target |
|--------|----------------|----------------|
| Coach can manage athletes | ✓ | ✓ |
| Workouts scheduled/week | 10+ | 50+ |
| Activity sync success rate | - | 95%+ |
| Plan generation time | - | < 5 sec |
| User satisfaction (NPS) | - | 40+ |

---

## CEO's MVP Sprint (December 2024)

> **Objective:** Keep athletes on RidePro, away from TrainingPeaks distractions. Manual coach workflow for now, automation later.

### Core Goal

*"L'obiettivo è evitare di mandare gli atleti su TrainingPeaks (che li distrae e gli apre un mondo di alternative) e tenerli concentrati su RidePro."*

### MVP Features (Priority Order)

#### 1. Weekly Calendar (Google Calendar Style)
- [ ] Week view showing Monday → Sunday
- [ ] Drag & drop workouts from library to calendar
- [ ] Manual insertion (no automation yet)
- [ ] Click workout to view details
- [ ] Move workouts between days
- [ ] Delete scheduled workouts

#### 2. Athlete Availability Page
- [ ] Weekly availability template (which days available)
- [ ] Time slots per day (morning/afternoon/evening)
- [ ] Max hours per day
- [ ] Primary goal (Category A) - can be long-term
- [ ] Secondary goals (B/C) optional

#### 3. Expanded Workout Library
Current library has 1-2h workouts only. Need to add:

| Category | Duration | Environment | Priority |
|----------|----------|-------------|----------|
| Indoor workouts | < 1 hour | Indoor | HIGH |
| Outdoor workouts | > 2 hours | Outdoor | HIGH |

### Why This Approach Works

1. **Athletes see personalized plans** → Feels like platform is working
2. **Coach builds manually** → Full control, quality output
3. **We gain time** → Develop automation properly in background
4. **Athletes stay engaged** → Don't need TrainingPeaks

### Technical Implementation

| Feature | Frontend | Backend | Database |
|---------|----------|---------|----------|
| Calendar | React + dnd-kit | NestJS endpoints | `TrainingWeek`, `ScheduledWorkout` |
| Availability | Chakra UI form | CRUD endpoints | `AthleteAvailability` |
| Goals | Simple form | CRUD endpoints | `Goal` (A/B/C priority) |
| Library | Filter by duration/env | Query filters | `Workout` with tags |

---

*Document maintained by RidePro Development Team*
