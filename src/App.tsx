import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CalendarPage, AvailabilityPage, CoachPage, WorkoutBuilderPage, AthleteCalendarPage, AthleteStatsPage, AthleteDashboardPage, CoachDashboardPage, OnboardingPage } from './pages';
import { WorkoutVisualizerPage } from './pages/WorkoutVisualizerPage';
import { useUser } from './contexts/UserContext';
import { AuthGuard, OnboardingGuard } from './components/guards';

// Dashboard router component that shows appropriate dashboard based on user role
function DashboardPage() {
  const { isCoach } = useUser();
  return isCoach ? <CoachDashboardPage /> : <AthleteDashboardPage />;
}

function App() {
  const location = useLocation();

  return (
    <AuthGuard>
      <Routes key={location.pathname}>
        {/* Onboarding route - auth required but no onboarding guard */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected routes - guarded by auth + onboarding check */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <OnboardingGuard>
              <DashboardPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/calendar"
          element={
            <OnboardingGuard>
              <CalendarPage />
            </OnboardingGuard>
          }
        />
        <Route path="/athlete/:athleteId/calendar" element={<AthleteCalendarPage />} />
        <Route path="/athlete/:athleteId/stats" element={<AthleteStatsPage />} />
        <Route path="/visualizer" element={<WorkoutVisualizerPage />} />
        <Route
          path="/settings"
          element={
            <OnboardingGuard>
              <AvailabilityPage />
            </OnboardingGuard>
          }
        />
        <Route path="/coach" element={<CoachPage />} />
        <Route path="/workout/new" element={<WorkoutBuilderPage />} />
        <Route path="/workout/:id" element={<WorkoutBuilderPage />} />
      </Routes>
    </AuthGuard>
  );
}

export default App;
