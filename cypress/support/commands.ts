/// <reference types="cypress" />
import '@testing-library/cypress/add-commands';

// Custom commands for RidePro testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login via Clerk UI
       */
      clerkLogin(email?: string, password?: string): Chainable<void>;

      /**
       * Select a user from the user switcher dropdown
       */
      selectUser(userName: string): Chainable<void>;

      /**
       * Navigate to a specific page using the navigation
       */
      navigateTo(page: 'dashboard' | 'calendar' | 'coach' | 'settings'): Chainable<void>;

      /**
       * Wait for the app to finish loading
       */
      waitForAppLoad(): Chainable<void>;

      /**
       * Intercept and mock API calls
       */
      mockApi(endpoint: string, fixture: string): Chainable<void>;

      /**
       * Switch language
       */
      switchLanguage(lang: 'en' | 'it'): Chainable<void>;

      /**
       * Get element by data-testid
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Get element by data-tour attribute
       */
      getByTour(tourId: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// Login via Clerk UI (embedded component)
Cypress.Commands.add('clerkLogin', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('testUserEmail');
  const testPassword = password || Cypress.env('testUserPassword');

  // Visit the app - will show Clerk sign-in component
  cy.visit('/');

  // Wait for Clerk's embedded sign-in form to appear
  cy.get('input[name="identifier"]', { timeout: 20000 }).should('be.visible');

  // Enter email
  cy.get('input[name="identifier"]').clear().type(testEmail);

  // Click continue/submit
  cy.get('button[type="submit"]').first().click();

  // Wait for password field
  cy.get('input[type="password"]', { timeout: 15000 }).should('be.visible');

  // Enter password
  cy.get('input[type="password"]').clear().type(testPassword);

  // Submit login
  cy.get('button[type="submit"]').first().click();

  // Wait to be logged in and redirected to dashboard
  cy.url({ timeout: 20000 }).should('include', '/dashboard');

  // Wait for app to fully load
  cy.get('body').should('be.visible');
});

// Select a user from the user switcher
Cypress.Commands.add('selectUser', (userName: string) => {
  cy.get('[data-testid="user-switcher"]').click();
  cy.contains(userName).click();
  cy.waitForAppLoad();
});

// Navigate to a specific page
Cypress.Commands.add('navigateTo', (page) => {
  const routes: Record<string, string> = {
    dashboard: '/',
    calendar: '/calendar',
    coach: '/coach',
    settings: '/settings',
  };

  cy.get(`[data-tour="nav-${page}"]`).click();
  cy.url().should('include', routes[page] || '/');
});

// Wait for the app to finish loading
Cypress.Commands.add('waitForAppLoad', () => {
  // Wait for loading indicators to disappear
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist');
  // Alternative: wait for main content
  cy.get('main', { timeout: 10000 }).should('be.visible');
});

// Mock API calls
Cypress.Commands.add('mockApi', (endpoint: string, fixture: string) => {
  cy.intercept('GET', `**/api/${endpoint}`, { fixture }).as(endpoint);
});

// Switch language
Cypress.Commands.add('switchLanguage', (lang) => {
  cy.get('[data-testid="language-switcher"]').click();
  cy.contains(lang === 'en' ? 'English' : 'Italiano').click();
});

// Get element by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Get element by data-tour attribute
Cypress.Commands.add('getByTour', (tourId: string) => {
  return cy.get(`[data-tour="${tourId}"]`);
});

// Dismiss joyride tour if visible
Cypress.Commands.add('dismissTour', () => {
  cy.get('body').then(($body) => {
    // Check if joyride overlay exists
    if ($body.find('.react-joyride__overlay').length > 0) {
      // Try clicking skip button first
      const skipButton = $body.find('button').filter((_, el) => {
        return el.textContent?.toLowerCase().includes('skip');
      });
      if (skipButton.length > 0) {
        cy.wrap(skipButton.first()).click({ force: true });
      } else {
        // Fall back to escape key
        cy.get('body').type('{esc}');
      }
      // Wait for overlay to disappear
      cy.wait(500);
    }
  });
});

// Declare the dismissTour command in the namespace
declare global {
  namespace Cypress {
    interface Chainable {
      dismissTour(): Chainable<void>;
    }
  }
}

export {};
