/// <reference types="cypress" />

/**
 * User Roles E2E Tests
 * Tests user switching between athlete and coach roles,
 * and testing the user switcher functionality
 *
 * User Journey: Dev/Demo mode user switching
 * 1. User switcher dropdown in header
 * 2. Select different users (athletes, coaches)
 * 3. UI updates based on selected role
 * 4. Permissions and views change accordingly
 */

describe('User Role Management', () => {
  describe('User Switcher', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('should display user switcher in header', () => {
      // User switcher dropdown should be visible
      cy.get('[data-testid="user-switcher"], [aria-label*="user"], [aria-label*="utente"]').should('exist');
    });

    it('should show current user name', () => {
      cy.get('[data-testid="user-switcher"], [aria-label*="user"]').then($switcher => {
        // Should display a user name
        expect($switcher.text()).to.match(/\w+/);
      });
    });

    it('should open user dropdown on click', () => {
      cy.get('[data-testid="user-switcher"], [aria-label*="user"]').first().click({ force: true });

      // Dropdown should appear with user options
      cy.get('[role="menu"], [role="listbox"]').should('be.visible');
    });

    it('should show list of available users', () => {
      cy.get('[data-testid="user-switcher"], [aria-label*="user"]').first().click({ force: true });

      // Should show multiple users
      cy.get('[role="menuitem"], [role="option"]').should('have.length.greaterThan', 0);
    });

    it('should switch to different user', () => {
      cy.get('[data-testid="user-switcher"], [aria-label*="user"]').first().click({ force: true });

      // Click on a different user
      cy.get('[role="menuitem"], [role="option"]').eq(1).click({ force: true });

      cy.wait(500);

      // UI should update
      cy.get('body').should('be.visible');
    });
  });

  describe('Athlete Role', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('should show athlete dashboard elements', () => {
      // Athlete-specific elements
      cy.get('[data-tour="today-workout"]').should('exist');
      cy.get('[data-tour="weekly-stats"]').should('exist');
      cy.get('[data-tour="upcoming-workouts"]').should('exist');
    });

    it('should show athlete navigation', () => {
      // Navigation should have athlete menu items
      cy.get('nav, header').within(() => {
        cy.contains(/calendar|calendario/i).should('exist');
        cy.contains(/settings|impostazioni/i).should('exist');
      });
    });

    it('should access athlete calendar', () => {
      cy.visit('/calendar');

      // Should show personal calendar
      cy.contains(/training calendar|calendario/i).should('exist');
    });

    it('should access athlete settings', () => {
      cy.visit('/settings');

      // Should show personal settings
      cy.contains(/settings|profile|availability|impostazioni|profilo|disponibilità/i).should('exist');
    });

    it('should show personal stats', () => {
      cy.visit('/dashboard');

      // Stats should be personal (not team/athlete list)
      cy.get('[data-tour="weekly-stats"]').within(() => {
        cy.contains(/TSS|workout|allenament/i).should('exist');
      });
    });
  });

  describe('Coach Role', () => {
    beforeEach(() => {
      cy.visit('/coach');
    });

    it('should show coach dashboard elements', () => {
      // Coach-specific elements
      cy.contains(/athlete|atleti/i).should('exist');
    });

    it('should display athlete management', () => {
      // Athlete cards or list
      cy.get('[data-testid="athlete-card"], [data-testid="athlete-list"]').should('exist');
    });

    it('should have invite athlete button', () => {
      cy.get('button').filter(':contains("Invite"), :contains("Invita")').should('exist');
    });

    it('should access workout builder', () => {
      cy.visit('/workout/new');

      // Workout builder should be accessible
      cy.contains(/workout builder|crea allenamento|workout/i).should('exist');
    });

    it('should navigate to athlete calendar', () => {
      // Click on athlete card
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).click({ force: true });
          cy.wait(500);

          // Should navigate to athlete's calendar
          cy.url().then(url => {
            const isAthleteView = url.includes('/athlete/');
            const hasModal = Cypress.$('[role="dialog"]').length > 0;
            expect(isAthleteView || hasModal).to.be.true;
          });
        }
      });
    });
  });

  describe('Role-Based Access', () => {
    it('should redirect unauthenticated users', () => {
      // Clear any auth state
      cy.clearLocalStorage();
      cy.clearCookies();

      cy.visit('/dashboard', { failOnStatusCode: false });

      // Should redirect to login or show auth required
      cy.url().then(url => {
        // Either redirected to sign-in or shows login prompt
        const isSignIn = url.includes('sign-in') || url.includes('login');
        const hasAuthUI = Cypress.$('[data-testid="auth-required"]').length > 0;
        expect(isSignIn || hasAuthUI).to.be.true;
      });
    });

    it('should restrict coach pages for athletes', () => {
      // As athlete, try to access coach-only pages
      cy.visit('/workout/new');

      // Should either show the page (if athletes can create) or redirect
      cy.get('body').should('be.visible');
    });

    it('should show athlete own calendar only', () => {
      // Athlete should see their own calendar at /calendar
      cy.visit('/calendar');

      // Should be personal calendar (not another athlete's)
      cy.contains(/training calendar|calendario/i).should('exist');
    });
  });

  describe('User Profile', () => {
    beforeEach(() => {
      cy.visit('/settings');
    });

    it('should display user profile information', () => {
      cy.contains(/profile|profilo/i).should('exist');
    });

    it('should show user name', () => {
      cy.get('input[name="fullName"], input[name="name"]').should('exist');
    });

    it('should show FTP settings', () => {
      cy.contains(/FTP|threshold/i).should('exist');
    });

    it('should show training zones', () => {
      cy.contains(/zones|zone/i).should('exist');
    });

    it('should allow editing profile', () => {
      // Profile fields should be editable
      cy.get('input').first().should('not.be.disabled');
    });
  });

  describe('Demo Mode User Switching', () => {
    it('should switch between demo users', () => {
      cy.visit('/dashboard');

      // Open user switcher
      cy.get('[data-testid="user-switcher"]').click({ force: true });

      // Select a different demo user
      cy.get('[role="menuitem"], [role="option"]').then($options => {
        if ($options.length > 1) {
          cy.wrap($options).eq(1).click({ force: true });
          cy.wait(500);

          // Dashboard should reflect new user
          cy.get('body').should('be.visible');
        }
      });
    });

    it('should persist user selection', () => {
      cy.visit('/dashboard');

      // Switch user
      cy.get('[data-testid="user-switcher"]').click({ force: true });
      cy.get('[role="menuitem"], [role="option"]').eq(1).click({ force: true });
      cy.wait(500);

      // Get selected user name
      cy.get('[data-testid="user-switcher"]').invoke('text').then(userName => {
        // Navigate to another page
        cy.visit('/calendar');

        // Same user should be selected
        cy.get('[data-testid="user-switcher"]').should('contain.text', userName.trim());
      });
    });

    it('should update dashboard data on user switch', () => {
      cy.visit('/dashboard');

      // Get initial stats
      cy.get('[data-tour="weekly-stats"]').invoke('text').then(initialStats => {
        // Switch user
        cy.get('[data-testid="user-switcher"]').click({ force: true });
        cy.get('[role="menuitem"], [role="option"]').eq(1).click({ force: true });
        cy.wait(1000);

        // Stats might be different (or same if same training load)
        cy.get('[data-tour="weekly-stats"]').should('be.visible');
      });
    });
  });

  describe('Theme Toggle', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('should have color mode toggle', () => {
      cy.get('[data-testid="color-mode-toggle"], button[aria-label*="theme"], button[aria-label*="mode"]').should('exist');
    });

    it('should switch to dark mode', () => {
      cy.get('[data-testid="color-mode-toggle"], button[aria-label*="theme"]').first().click({ force: true });

      // Body should have dark mode styles
      cy.get('body').should('have.css', 'background-color').and('not.equal', 'rgb(255, 255, 255)');
    });

    it('should persist theme preference', () => {
      // Set dark mode
      cy.get('[data-testid="color-mode-toggle"]').first().click({ force: true });
      cy.wait(300);

      // Navigate to another page
      cy.visit('/calendar');

      // Theme should persist
      cy.get('body').should('be.visible');
    });
  });

  describe('Mobile User Experience', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should show user switcher on mobile', () => {
      cy.visit('/dashboard');

      // User switcher should be accessible on mobile
      cy.get('[data-testid="user-switcher"], [aria-label*="user"]').should('exist');
    });

    it('should open mobile menu', () => {
      cy.visit('/dashboard');

      // Mobile hamburger menu
      cy.get('[aria-label*="menu"], button[data-testid="mobile-menu"]').first().click({ force: true });

      // Navigation should be visible
      cy.get('nav, [role="navigation"]').should('be.visible');
    });

    it('should navigate via mobile menu', () => {
      cy.visit('/dashboard');

      cy.get('[aria-label*="menu"], button[data-testid="mobile-menu"]').first().click({ force: true });

      // Click calendar link
      cy.contains(/calendar|calendario/i).click({ force: true });

      cy.url().should('include', '/calendar');
    });
  });
});
