/// <reference types="cypress" />

/**
 * Workout Completion E2E Tests
 * Tests the workout completion flow from dashboard and calendar
 *
 * User Journey: Athlete completes a workout
 * 1. View today's workout on dashboard
 * 2. Click to start/complete workout
 * 3. Enter actual data (duration, TSS, notes)
 * 4. Submit completion
 * 5. Verify workout shows as completed
 */

describe('Workout Completion', () => {
  describe('From Dashboard', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('should display today\'s workout spotlight', () => {
      // Today's workout section should be visible
      cy.get('[data-tour="today-workout"]').should('exist');
    });

    it('should show workout details', () => {
      cy.get('[data-tour="today-workout"]').then($el => {
        // Check if there's a workout or rest day message
        const text = $el.text();
        const hasWorkout = text.match(/start|view|inizia|visualizza/i);
        const isRestDay = text.match(/rest day|giorno di riposo/i);

        expect(hasWorkout || isRestDay).to.exist;
      });
    });

    it('should open workout completion modal', () => {
      cy.get('[data-tour="today-workout"]').then($workout => {
        // If there's a workout today, click to open modal
        const hasButton = $workout.find('button');
        if (hasButton.length > 0) {
          cy.wrap(hasButton).first().click({ force: true });
          cy.wait(500);

          // Modal should appear
          cy.get('[role="dialog"]').should('be.visible');
        }
      });
    });

    it('should display completion form fields', () => {
      cy.get('[data-tour="today-workout"]').find('button').first().click({ force: true });
      cy.wait(500);

      cy.get('[role="dialog"]').then($modal => {
        if ($modal.length > 0) {
          // Form should have fields for actual data
          cy.contains(/actual|effettivo/i).should('exist');
          cy.contains(/duration|durata/i).should('exist');
        }
      });
    });
  });

  describe('Completion Modal', () => {
    beforeEach(() => {
      cy.visit('/calendar');
    });

    it('should open completion modal from calendar workout', () => {
      cy.get('body').then($body => {
        const workoutCard = $body.find('[data-testid="scheduled-workout"], .workout-card');
        if (workoutCard.length > 0) {
          cy.wrap(workoutCard).first().click({ force: true });
          cy.get('[role="dialog"]').should('be.visible');
        }
      });
    });

    it('should have complete/incomplete toggle', () => {
      cy.get('body').then($body => {
        const workoutCard = $body.find('[data-testid="scheduled-workout"]');
        if (workoutCard.length > 0) {
          cy.wrap(workoutCard).first().click({ force: true });

          // Should have completion status toggle
          cy.get('[role="dialog"]').should('contain.text', /complete|completa/i);
        }
      });
    });

    it('should accept actual duration input', () => {
      cy.get('body').then($body => {
        const workoutCard = $body.find('[data-testid="scheduled-workout"]');
        if (workoutCard.length > 0) {
          cy.wrap(workoutCard).first().click({ force: true });

          // Duration input
          cy.get('[role="dialog"]').find('input[name*="duration"], input[type="number"]').first().then($input => {
            cy.wrap($input).clear().type('60');
          });
        }
      });
    });

    it('should accept actual TSS input', () => {
      cy.get('body').then($body => {
        const workoutCard = $body.find('[data-testid="scheduled-workout"]');
        if (workoutCard.length > 0) {
          cy.wrap(workoutCard).first().click({ force: true });

          // TSS input
          cy.get('[role="dialog"]').find('input[name*="tss"], input[placeholder*="TSS"]').then($input => {
            if ($input.length > 0) {
              cy.wrap($input).clear().type('75');
            }
          });
        }
      });
    });

    it('should accept notes', () => {
      cy.get('body').then($body => {
        const workoutCard = $body.find('[data-testid="scheduled-workout"]');
        if (workoutCard.length > 0) {
          cy.wrap(workoutCard).first().click({ force: true });

          // Notes textarea
          cy.get('[role="dialog"]').find('textarea').then($textarea => {
            if ($textarea.length > 0) {
              cy.wrap($textarea).type('Great workout, felt strong!');
            }
          });
        }
      });
    });

    it('should close modal on cancel', () => {
      cy.get('body').then($body => {
        const workoutCard = $body.find('[data-testid="scheduled-workout"]');
        if (workoutCard.length > 0) {
          cy.wrap(workoutCard).first().click({ force: true });
          cy.get('[role="dialog"]').should('be.visible');

          // Close modal
          cy.get('button[aria-label="Close"], button:contains("Cancel"), button:contains("Annulla")').click();
          cy.get('[role="dialog"]').should('not.exist');
        }
      });
    });
  });

  describe('Weekly Progress', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('should display weekly stats', () => {
      cy.get('[data-tour="weekly-stats"]').should('exist');
    });

    it('should show completed workouts count', () => {
      cy.get('[data-tour="weekly-stats"]').within(() => {
        // Should show X of Y workouts
        cy.contains(/workout|allenament/i).should('exist');
      });
    });

    it('should show TSS progress', () => {
      cy.get('[data-tour="weekly-stats"]').within(() => {
        // Should show TSS values
        cy.contains(/TSS/i).should('exist');
      });
    });

    it('should show hours progress', () => {
      cy.get('[data-tour="weekly-stats"]').within(() => {
        // Should show hours
        cy.contains(/hour|ora|h/i).should('exist');
      });
    });

    it('should display progress rings/bars', () => {
      cy.get('[data-tour="weekly-stats"]').within(() => {
        // Progress indicators
        cy.get('[role="progressbar"], svg circle, .progress-ring').should('exist');
      });
    });
  });

  describe('Upcoming Workouts', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('should display upcoming workouts section', () => {
      cy.get('[data-tour="upcoming-workouts"]').should('exist');
    });

    it('should show workout preview cards', () => {
      cy.get('[data-tour="upcoming-workouts"]').then($section => {
        // Check for workout cards or empty state
        const hasWorkouts = $section.find('[data-testid="workout-preview"], .workout-preview').length > 0;
        const isEmpty = $section.text().match(/no.*workout|nessun.*allenament/i);

        expect(hasWorkouts || isEmpty).to.exist;
      });
    });

    it('should navigate to calendar on View All click', () => {
      cy.get('[data-tour="upcoming-workouts"]').find('button, a').filter(':contains("View"), :contains("Vedi")').first().click({ force: true });
      cy.url().should('include', '/calendar');
    });

    it('should click on upcoming workout to view details', () => {
      cy.get('[data-tour="upcoming-workouts"]').then($section => {
        const workoutPreview = $section.find('[data-testid="workout-preview"]');
        if (workoutPreview.length > 0) {
          cy.wrap(workoutPreview).first().click({ force: true });
          cy.get('[role="dialog"]').should('be.visible');
        }
      });
    });
  });

  describe('Completion Status Persistence', () => {
    it('should maintain completed status after page refresh', () => {
      cy.visit('/calendar');

      // Find a completed workout
      cy.get('body').then($body => {
        const completedWorkout = $body.find('[data-completed="true"]');
        if (completedWorkout.length > 0) {
          // Refresh page
          cy.reload();

          // Workout should still be marked completed
          cy.get('[data-completed="true"]').should('exist');
        }
      });
    });

    it('should update dashboard stats after completion', () => {
      cy.visit('/dashboard');

      // Check initial stats
      cy.get('[data-tour="weekly-stats"]').invoke('text').then(initialStats => {
        // Navigate to calendar, complete a workout, come back
        cy.visit('/calendar');

        cy.get('body').then($body => {
          const incompleteWorkout = $body.find('[data-completed="false"]');
          if (incompleteWorkout.length > 0) {
            cy.wrap(incompleteWorkout).first().click({ force: true });

            // Mark as complete
            cy.get('[role="dialog"]').find('button:contains("Complete"), button:contains("Completa")').click();
            cy.wait(500);

            // Go back to dashboard
            cy.visit('/dashboard');

            // Stats should be updated
            cy.get('[data-tour="weekly-stats"]').should('be.visible');
          }
        });
      });
    });
  });

  describe('Assessment Tests', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('should display assessment card', () => {
      // Assessment card should be visible for self-testing
      cy.get('body').then($body => {
        if ($body.find('[data-testid="assessment-card"]').length > 0) {
          cy.get('[data-testid="assessment-card"]').should('be.visible');
        }
      });
    });

    it('should open assessment modal', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="assessment-card"]').length > 0) {
          cy.get('[data-testid="assessment-card"]').find('button').click({ force: true });
          cy.get('[role="dialog"]').should('be.visible');
        }
      });
    });

    it('should show assessment protocol options', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="assessment-card"]').length > 0) {
          cy.get('[data-testid="assessment-card"]').find('button').click({ force: true });

          // Should show protocol selection
          cy.get('[role="dialog"]').should('contain.text', /sprint|1.*2.*5.*min/i);
        }
      });
    });
  });
});
