/// <reference types="cypress" />

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.setAttribute('data-hide-command-log-request', '');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  app.document.head.appendChild(style);
}

// Global before each
beforeEach(() => {
  // Set default viewport
  cy.viewport(1280, 720);

  // Dismiss joyride tour if visible (escape key or click outside)
  cy.on('window:load', (win) => {
    // Set localStorage to skip the tour
    win.localStorage.setItem('ridepro-tour-completed', 'true');
    win.localStorage.setItem('ridepro-setup-dismissed', 'true');
  });

  // Use cy.session() for persistent login across tests
  cy.session(
    'clerk-auth',
    () => {
      const testEmail = Cypress.env('testUserEmail');
      const testPassword = Cypress.env('testUserPassword');

      // Visit the app
      cy.visit('/');

      // Wait for Clerk's embedded sign-in form to appear
      cy.get('input[name="identifier"]', { timeout: 30000 }).should('be.visible');

      // Enter email
      cy.get('input[name="identifier"]').clear().type(testEmail);

      // Click the Continue button by text
      cy.contains('button', 'Continue').click();

      // Wait for password field animation to complete (Clerk uses opacity transition)
      cy.wait(1000); // Wait for animation
      cy.get('input[type="password"]', { timeout: 20000 })
        .should('exist')
        .and('not.have.css', 'opacity', '0');

      // Enter password
      cy.get('input[type="password"]').clear({ force: true }).type(testPassword, { force: true });

      // Submit login - click Continue button
      cy.contains('button', 'Continue').click();

      // Wait for login to complete - URL should not contain factor-one or factor-two
      cy.url({ timeout: 30000 })
        .should('not.include', 'factor-one')
        .and('not.include', 'factor-two')
        .and('not.include', 'sign-in');

      // Wait for authenticated content to appear (dashboard elements)
      cy.get('body', { timeout: 15000 }).should('be.visible');

      // Additional wait for Clerk to fully initialize
      cy.wait(2000);
    },
    {
      validate: () => {
        // Visit the app and check we're not redirected to sign-in
        cy.visit('/');
        cy.url({ timeout: 10000 }).should('not.include', 'sign-in');
        cy.url().should('not.include', 'factor-one');
      },
      cacheAcrossSpecs: true,
    }
  );
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Log the error but don't fail the test for known issues
  console.error('Uncaught exception:', err.message);

  // Prevent Cypress from failing on certain errors
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }

  // Prevent Clerk-related errors from failing tests
  if (err.message.includes('Clerk') || err.message.includes('clerk')) {
    return false;
  }

  // Return false to prevent the error from failing the test
  // Return true to fail the test
  return true;
});
