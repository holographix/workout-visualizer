/**
 * DashboardTour - Guided tour using React Joyride
 *
 * Shows a tooltip-based walkthrough of the dashboard features for new athletes.
 * Tour steps highlight:
 * - Welcome message (centered)
 * - Dashboard navigation
 * - Calendar navigation
 * - Settings navigation
 *
 * Features:
 * - Filters steps to only show those with visible DOM targets
 * - Handles TARGET_NOT_FOUND by skipping to next step
 * - Can be skipped and tracks completion via API
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import type { Step, CallBackProps } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useColorModeValue } from '@chakra-ui/react';

interface DashboardTourProps {
  run: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function DashboardTour({ run, onComplete, onSkip }: DashboardTourProps) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);

  // Colors for tooltip styling
  const bgColor = useColorModeValue('#FFFFFF', '#1A202C');
  const textColor = useColorModeValue('#2D3748', '#E2E8F0');
  const primaryColor = useColorModeValue('#3182CE', '#63B3ED');

  // All possible tour steps - targets use CSS selectors
  const allSteps: Step[] = useMemo(() => [
    {
      target: 'body',
      content: t('tour.steps.welcome.content', 'Welcome to RidePro! Let us show you around your new training dashboard.'),
      title: t('tour.steps.welcome.title', 'Welcome!'),
      placement: 'center' as const,
      disableBeacon: true,
    },
    {
      target: '[data-tour="nav-dashboard"]',
      content: t('tour.steps.dashboard.content', 'This is your dashboard - your home for all training information at a glance.'),
      title: t('tour.steps.dashboard.title', 'Dashboard'),
      placement: 'bottom' as const,
      disableBeacon: true,
    },
    {
      target: '[data-tour="nav-calendar"]',
      content: t('tour.steps.calendar.content', 'View your full training calendar here. Your coach will assign workouts to specific dates.'),
      title: t('tour.steps.calendar.title', 'Training Calendar'),
      placement: 'bottom' as const,
      disableBeacon: true,
    },
    {
      target: '[data-tour="nav-settings"]',
      content: t('tour.steps.settings.content', 'Update your profile, set your availability, and configure your training preferences here.'),
      title: t('tour.steps.settings.title', 'Settings'),
      placement: 'bottom' as const,
      disableBeacon: true,
    },
  ], [t]);

  // Filter steps to only include those whose targets exist and are visible in the DOM
  const [visibleSteps, setVisibleSteps] = useState<Step[]>([]);

  // Helper to check if element is visible (exists and has dimensions)
  const isElementVisible = useCallback((selector: string): boolean => {
    const element = document.querySelector(selector);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    // Element must have both width and height to be considered visible
    return rect.width > 0 && rect.height > 0;
  }, []);

  useEffect(() => {
    if (run) {
      // Wait for DOM to be fully ready (300ms gives React time to render)
      const timer = setTimeout(() => {
        const filtered = allSteps.filter(step => {
          if (step.target === 'body') return true;
          return isElementVisible(step.target as string);
        });
        setVisibleSteps(filtered);
        setStepIndex(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [run, allSteps, isElementVisible]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;

    // Handle step changes
    if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + 1);
    }

    // Handle target not found - skip to next step
    if (type === EVENTS.TARGET_NOT_FOUND) {
      // Move to next step if current target isn't visible
      if (index < visibleSteps.length - 1) {
        setStepIndex(index + 1);
      } else {
        // Last step not found, complete the tour
        onComplete();
      }
    }

    // Handle tour completion
    if (status === STATUS.FINISHED) {
      onComplete();
    }

    // Handle tour skip
    if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
      onSkip();
    }
  }, [onComplete, onSkip, visibleSteps.length]);

  // Don't render if no visible steps
  if (visibleSteps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={visibleSteps}
      run={run && visibleSteps.length > 0}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep={false}
      spotlightPadding={8}
      disableOverlayClose
      disableScrolling
      callback={handleJoyrideCallback}
      floaterProps={{
        disableAnimation: true,
      }}
      styles={{
        options: {
          arrowColor: bgColor,
          backgroundColor: bgColor,
          primaryColor: primaryColor,
          textColor: textColor,
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
        },
        tooltipContent: {
          fontSize: 14,
          lineHeight: 1.5,
        },
        buttonNext: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 14,
          marginRight: 8,
        },
        buttonSkip: {
          fontSize: 14,
        },
        spotlight: {
          borderRadius: 12,
        },
      }}
      locale={{
        back: t('tour.buttons.back', 'Back'),
        close: t('tour.buttons.close', 'Close'),
        last: t('tour.buttons.finish', 'Finish'),
        next: t('tour.buttons.next', 'Next'),
        skip: t('tour.buttons.skip', 'Skip tour'),
      }}
    />
  );
}
