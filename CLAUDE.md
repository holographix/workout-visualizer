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

Build a premium, interactive visualization for structured workout files. Transform raw JSON data into a beautiful, intuitive workout profile that helps athletes understand their training session at a glance.

## Architecture

React + TypeScript + Vite app using visx (Airbnb's D3 wrapper for React) for charting.

### Data Flow

1. **Workout JSON** → Raw workout data with nested structure (steps, repetitions)
2. **Parser** (`src/utils/parser.ts`) → Recursively flattens nested structure into `FlatSegment[]` timeline with absolute start/end times
3. **WorkoutChart** (`src/components/WorkoutChart.tsx`) → Renders segments as colored bars using visx

### Key Types (`src/types/workout.ts`)

- `Workout`: Raw format with nested `structure.structure[]` containing steps and repetitions
- `FlatSegment`: Parsed segment with `startTime`, `endTime`, `targetMin/Max`, and intensity `type`
- `ParsedWorkout`: Final format with flattened `segments[]` array and metadata

### visx Libraries Used

- `@visx/responsive` - ParentSize for responsive charts
- `@visx/scale` - Linear scales for time (x) and intensity (y)
- `@visx/shape` - Bar for standard blocks, Polygon for ramps
- `@visx/axis` - Time and % FTP axes
- `@visx/tooltip` - Hover tooltips

## Visual Specification

### Power Zone Colors (Coggan standard)

| Zone | % FTP | Color |
|------|-------|-------|
| Active Recovery | <55% | Gray/Blue |
| Endurance | 56-75% | Green |
| Tempo | 76-90% | Yellow |
| Threshold | 91-105% | Orange |
| VO2Max/Anaerobic | >105% | Red |

### Current Intensity Class Colors

- `warmUp` → Blue (#60a5fa)
- `active` → Red (#f87171)
- `rest` → Green (#34d399)
- `coolDown` → Purple (#818cf8)

### Special Rendering

- **Ramps**: Warm up/cool down with start/end targets → trapezoids (slopes), not rectangles
- **Open Duration**: Steps with `openDuration: true` → fixed 5-minute visual width with faded gradient edge

## Development Roadmap

### Phase 1: Foundation & MVP ✓
- [x] Project setup (Vite + React + Visx)
- [x] JSON Parser/Transformer (recursive flattening)
- [x] Basic Chart Component (Time vs Intensity bars)
- [x] Workout Metadata display (Title, TSS, IF, Duration)

### Phase 2: Interaction & Polish
- [ ] Hover tooltips (Phase Name, Duration, Intensity, Description)
- [ ] Click to select/highlight segments
- [ ] Summary panel for selected interval
- [ ] Visual polish (gradients, glassmorphism, animated transitions)
- [ ] Mouse-following "Current Time" cursor
- [ ] Zoom & pan for complex interval sets

### Phase 3: Advanced Features
- [ ] Structure list view (synced with graph hover)
- [ ] Export to PNG
- [ ] Overlay/comparison functionality
- [ ] Interval editing (stretch goal)

## Workout JSON Structure

The raw data has nested repetition structures that must be flattened:

```
structure.structure[] → Array of:
  - type: "step" → single interval with steps[] containing one step
  - type: "repetition" → repeated set with length.value iterations of steps[]
    - steps[] can contain nested "step" or "repetition" types
```

Each step has: `name`, `length` (value + unit), `targets[]` (minValue/maxValue), `intensityClass`, `openDuration`
