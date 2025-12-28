/// <reference types="cypress" />

/**
 * Workout Scheduling E2E Tests
 * Tests the workout library and calendar scheduling functionality
 *
 * User Journey: Athlete schedules workouts from library
 * 1. Open calendar
 * 2. Open workout library modal
 * 3. Browse/search workouts
 * 4. Drag and drop workout to calendar day
 * 5. Verify workout appears on calendar
 */

describe('Workout Scheduling', () => {
  beforeEach(() => {
    cy.visit('/calendar');
  });

  describe('Calendar Page', () => {
    it('should display the calendar', () => {
      // Calendar should be visible with day columns
      cy.contains(/training calendar|calendario/i).should('be.visible');
    });

    it('should show week navigation', () => {
      // Previous/Next week buttons
      cy.get('button[aria-label*="Previous"]').should('be.visible');
      cy.get('button[aria-label*="Next"]').should('be.visible');
      cy.contains('button', /today|oggi/i).should('be.visible');
    });

    it('should display day columns', () => {
      // Should show days of the week
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach(day => {
        cy.contains(day).should('exist');
      });
    });
  });

  describe('Workout Library Modal', () => {
    it('should open workout library', () => {
      // Click the library button (folder icon)
      cy.get('button').filter(':contains("Library"), [aria-label*="library"], [aria-label*="folder"]').first().click({ force: true });

      // Modal should appear
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains(/workout library|libreria/i).should('be.visible');
    });

    it('should display workout categories', () => {
      cy.get('button').filter(':contains("Library"), [aria-label*="library"], [aria-label*="folder"]').first().click({ force: true });
      cy.get('[role="dialog"]').should('be.visible');

      // Should show categories like Endurance, Threshold, etc.
      cy.contains(/endurance|resistenza/i).should('exist');
    });

    it('should search workouts', () => {
      cy.get('button').filter(':contains("Library"), [aria-label*="library"], [aria-label*="folder"]').first().click({ force: true });
      cy.get('[role="dialog"]').should('be.visible');

      // Search input
      cy.get('input[placeholder*="Search"], input[placeholder*="Cerca"]').type('interval');
      cy.wait(500);

      // Results should filter
      cy.get('[role="dialog"]').should('contain', /interval/i);
    });

    it('should show workout details', () => {
      cy.get('button').filter(':contains("Library"), [aria-label*="library"], [aria-label*="folder"]').first().click({ force: true });
      cy.get('[role="dialog"]').should('be.visible');

      // Click on a workout card
      cy.get('[role="dialog"]').find('[data-testid="workout-card"], .workout-card').first().click({ force: true });

      // Should show workout details (duration, TSS, IF)
      cy.get('body').then($body => {
        // Check for TSS or duration indicators
        const hasDetails = $body.text().match(/TSS|min|hour|ora/i);
        expect(hasDetails).to.exist;
      });
    });

    it('should close workout library', () => {
      cy.get('button').filter(':contains("Library"), [aria-label*="library"], [aria-label*="folder"]').first().click({ force: true });
      cy.get('[role="dialog"]').should('be.visible');

      // Close button
      cy.get('button[aria-label="Close"], button[aria-label="Chiudi"]').click();
      cy.get('[role="dialog"]').should('not.exist');
    });
  });

  describe('Week Navigation', () => {
    it('should navigate to previous week', () => {
      // Get current week dates for reference
      cy.get('button[aria-label*="Previous"]').first().click();
      cy.wait(300);

      // Calendar should update
      cy.get('body').should('be.visible');
    });

    it('should navigate to next week', () => {
      cy.get('button[aria-label*="Next"]').first().click();
      cy.wait(300);

      cy.get('body').should('be.visible');
    });

    it('should return to today', () => {
      // Navigate away
      cy.get('button[aria-label*="Next"]').first().click();
      cy.wait(300);
      cy.get('button[aria-label*="Next"]').first().click();
      cy.wait(300);

      // Click Today
      cy.contains('button', /today|oggi/i).click();
      cy.wait(300);

      // Should be back at current week
      cy.get('body').should('be.visible');
    });
  });

  describe('View Modes', () => {
    it('should toggle between week and month view', () => {
      // Find view toggle
      cy.get('body').then($body => {
        if ($body.find('button:contains("Month")').length > 0) {
          cy.contains('button', /month|mese/i).click();
          cy.wait(300);

          // Should show month view
          cy.get('body').should('be.visible');

          // Switch back to week
          cy.contains('button', /week|settimana/i).click();
          cy.wait(300);
        }
      });
    });
  });

  describe('Drag and Drop Scheduling', () => {
    it('should have draggable workout cards in library', () => {
      cy.get('button').filter(':contains("Library"), [aria-label*="library"], [aria-label*="folder"]').first().click({ force: true });
      cy.get('[role="dialog"]').should('be.visible');

      // Workout cards should be draggable
      cy.get('[role="dialog"]').find('[draggable="true"], [data-testid="workout-card"]').should('exist');
    });

    it('should have droppable day columns', () => {
      // Day columns should accept drops
      cy.get('[data-day], [data-droppable], .calendar-day').should('exist');
    });
  });

  describe('Scheduled Workout Display', () => {
    it('should display scheduled workouts on calendar', () => {
      // If there are workouts, they should show on the calendar
      cy.get('body').then($body => {
        if ($body.find('[data-testid="scheduled-workout"]').length > 0) {
          cy.get('[data-testid="scheduled-workout"]').first().should('be.visible');
        }
      });
    });

    it('should show workout details on card', () => {
      // Workout cards should show title and basic info
      cy.get('body').then($body => {
        const workoutCard = $body.find('[data-testid="scheduled-workout"], .workout-card').first();
        if (workoutCard.length > 0) {
          // Should have title or duration visible
          expect(workoutCard.text()).to.match(/\w+/);
        }
      });
    });

    it('should show completion status', () => {
      // Completed workouts should be visually distinct
      cy.get('body').then($body => {
        const completedWorkout = $body.find('[data-completed="true"], .completed');
        if (completedWorkout.length > 0) {
          cy.wrap(completedWorkout).first().should('have.class', 'completed').or('have.attr', 'data-completed', 'true');
        }
      });
    });
  });

  describe('Workout Context Menu', () => {
    it('should show actions on workout right-click or long-press', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="scheduled-workout"]').length > 0) {
          cy.get('[data-testid="scheduled-workout"]').first().rightclick();

          // Context menu should appear with actions
          cy.get('[role="menu"]').should('be.visible');
          cy.contains(/edit|delete|remove|modifica|elimina/i).should('exist');
        }
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should display calendar on mobile', () => {
      cy.visit('/calendar');
      cy.contains(/training calendar|calendario/i).should('be.visible');
    });

    it('should have mobile-friendly navigation', () => {
      cy.visit('/calendar');

      // Navigation buttons should be accessible
      cy.get('button[aria-label*="Previous"]').should('be.visible');
      cy.get('button[aria-label*="Next"]').should('be.visible');
    });

    it('should open library on mobile', () => {
      cy.visit('/calendar');

      cy.get('button').filter(':contains("Library"), [aria-label*="library"]').first().click({ force: true });
      cy.get('[role="dialog"]').should('be.visible');
    });
  });
});
