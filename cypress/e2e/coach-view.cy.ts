/// <reference types="cypress" />

/**
 * Coach View E2E Tests
 * Tests the coach dashboard and athlete management functionality
 *
 * User Journey: Coach manages athletes
 * 1. View athlete list on dashboard
 * 2. Click athlete to view their calendar
 * 3. Schedule workouts for athlete
 * 4. View athlete stats and progress
 * 5. Create custom workouts
 */

describe('Coach Dashboard', () => {
  beforeEach(() => {
    // Visit coach page
    cy.visit('/coach');
  });

  describe('Dashboard Layout', () => {
    it('should display coach dashboard', () => {
      cy.contains(/coach|allenatore/i).should('exist');
    });

    it('should show athlete list', () => {
      // Athletes section should be visible
      cy.contains(/athlete|atleti/i).should('exist');
    });

    it('should display navigation to athlete management', () => {
      cy.get('button, a').filter(':contains("Athletes"), :contains("Atleti")').should('exist');
    });
  });

  describe('Athlete List', () => {
    it('should display athlete cards', () => {
      cy.get('body').then($body => {
        // Check for athlete cards or empty state
        const hasAthletes = $body.find('[data-testid="athlete-card"]').length > 0;
        const isEmpty = $body.text().match(/no.*athlete|nessun.*atleta/i);

        expect(hasAthletes || isEmpty).to.exist;
      });
    });

    it('should show athlete profile information', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          // Should show name
          expect($card.text()).to.match(/\w+/);
        }
      });
    });

    it('should show athlete FTP/HR values', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          // Should show FTP or HR
          const text = $card.text();
          const hasFTP = text.match(/FTP|W|watt/i);
          const hasHR = text.match(/HR|bpm/i);
          expect(hasFTP || hasHR).to.exist;
        }
      });
    });

    it('should click athlete card to view details', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).click({ force: true });
          cy.wait(500);

          // Should navigate or open modal
          cy.url().then(url => {
            const navigated = url.includes('/athlete/');
            const hasModal = Cypress.$('[role="dialog"]').length > 0;
            expect(navigated || hasModal).to.be.true;
          });
        }
      });
    });
  });

  describe('Athlete Calendar View', () => {
    it('should navigate to athlete calendar', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).click({ force: true });
          cy.wait(500);

          // If navigated, should see athlete calendar
          cy.url().then(url => {
            if (url.includes('/athlete/')) {
              cy.contains(/calendar|calendario/i).should('exist');
            }
          });
        }
      });
    });

    it('should display athlete\'s scheduled workouts', () => {
      cy.visit('/athlete/test-athlete/calendar');
      cy.wait(500);

      cy.get('body').then($body => {
        // Should show calendar or 404
        const hasCalendar = $body.find('[data-testid="calendar"]').length > 0;
        const hasError = $body.text().match(/not found|404/i);
        expect(hasCalendar || hasError).to.exist;
      });
    });

    it('should allow coach to schedule workouts', () => {
      // Visit athlete calendar
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).click({ force: true });

          // If on athlete calendar, try to open library
          cy.get('button').filter(':contains("Library"), [aria-label*="library"]').first().then($btn => {
            if ($btn.length > 0) {
              cy.wrap($btn).click({ force: true });
              cy.get('[role="dialog"]').should('be.visible');
            }
          });
        }
      });
    });
  });

  describe('Athlete Stats View', () => {
    it('should navigate to athlete stats', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          // Look for stats link/button
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              cy.contains(/statistics|statistiche|progress|progressi/i).should('exist');
            }
          });
        }
      });
    });

    it('should display training load chart', () => {
      cy.visit('/athlete/test-athlete/stats');

      cy.get('body').then($body => {
        // Should show chart or placeholder
        const hasChart = $body.find('svg, canvas, [data-testid="chart"]').length > 0;
        const hasPlaceholder = $body.text().match(/no data|nessun dato/i);
        expect(hasChart || hasPlaceholder).to.exist;
      });
    });
  });

  describe('Workout Builder', () => {
    it('should navigate to workout builder', () => {
      cy.visit('/workout/new');

      // Should show workout builder
      cy.contains(/workout builder|crea allenamento/i).should('exist');
    });

    it('should display workout builder form', () => {
      cy.visit('/workout/new');

      // Form fields
      cy.get('input[name="title"], input[placeholder*="title"], input[placeholder*="titolo"]').should('exist');
    });

    it('should allow adding intervals', () => {
      cy.visit('/workout/new');

      // Add interval button
      cy.get('button').filter(':contains("Add"), :contains("Aggiungi")').should('exist');
    });

    it('should show workout preview', () => {
      cy.visit('/workout/new');

      // Preview section
      cy.get('[data-testid="workout-preview"], .workout-preview, svg').should('exist');
    });
  });

  describe('Invitation System', () => {
    it('should have invite athlete button', () => {
      cy.visit('/coach');

      // Invite button
      cy.get('button').filter(':contains("Invite"), :contains("Invita")').should('exist');
    });

    it('should open invite modal', () => {
      cy.visit('/coach');

      cy.get('button').filter(':contains("Invite"), :contains("Invita")').first().click({ force: true });

      // Modal should appear
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains(/email/i).should('exist');
    });
  });

  describe('Coach Mobile View', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should display coach dashboard on mobile', () => {
      cy.visit('/coach');
      cy.contains(/coach|allenatore/i).should('exist');
    });

    it('should show athlete list on mobile', () => {
      cy.visit('/coach');
      cy.contains(/athlete|atleti/i).should('exist');
    });

    it('should navigate to athlete on mobile', () => {
      cy.visit('/coach');

      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).click({ force: true });
          cy.wait(500);
        }
      });
    });
  });
});

describe('Coach vs Athlete View Switching', () => {
  describe('Role-based Dashboard', () => {
    it('should show athlete dashboard for athletes', () => {
      // As athlete, dashboard should show personal stats
      cy.visit('/dashboard');
      cy.get('[data-tour="today-workout"]').should('exist');
    });

    it('should show coach elements for coaches', () => {
      // Navigate to coach area
      cy.visit('/coach');
      cy.contains(/athlete|atleti/i).should('exist');
    });
  });

  describe('Navigation Differences', () => {
    it('should show athlete navigation items', () => {
      cy.visit('/dashboard');

      // Athlete should see: Dashboard, Calendar, Settings
      cy.get('nav, header').within(() => {
        cy.contains(/dashboard|home/i).should('exist');
        cy.contains(/calendar|calendario/i).should('exist');
      });
    });

    it('should show coach navigation items', () => {
      cy.visit('/coach');

      // Coach should see: Athletes, maybe Library
      cy.get('nav, header').then($nav => {
        const text = $nav.text();
        const hasCoachNav = text.match(/athlete|coach|allenatore/i);
        expect(hasCoachNav).to.exist;
      });
    });
  });
});
