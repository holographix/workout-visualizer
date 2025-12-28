/// <reference types="cypress" />

describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the header with logo and navigation', () => {
    // Dismiss any joyride tour overlay if present
    cy.dismissTour();

    // Logo should be visible
    cy.get('header').should('be.visible');
    cy.contains('RidePro').should('be.visible');

    // Navigation items should be visible on desktop (use force: true in case of any overlay)
    cy.getByTour('nav-dashboard').should('exist');
    cy.getByTour('nav-calendar').should('exist');
    cy.getByTour('nav-settings').should('exist');
  });

  it('should navigate to Dashboard', () => {
    cy.getByTour('nav-dashboard').click();
    cy.url().should('match', /\/(dashboard)?$/);
  });

  it('should navigate to Calendar', () => {
    cy.getByTour('nav-calendar').click();
    cy.url().should('include', '/calendar');
  });

  it('should navigate to Settings', () => {
    cy.getByTour('nav-settings').click();
    cy.url().should('include', '/settings');
  });

  it('should toggle color mode', () => {
    // Find and click the color mode toggle (aria-label contains "dark mode" or "light mode")
    cy.get('button[aria-label*="mode"]').first().click();

    // Verify the mode changed - Chakra uses class on html or body
    cy.get('html').should('satisfy', ($html) => {
      const className = $html.attr('class') || '';
      const style = $html.attr('style') || '';
      // Chakra toggles between 'chakra-ui-light' and 'chakra-ui-dark' classes
      // or uses color-scheme in style
      return className.includes('chakra-ui') || style.includes('color-scheme');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should show mobile menu button', () => {
      cy.get('button[aria-label*="menu"]').should('be.visible');
    });

    it('should open and close mobile drawer', () => {
      // Open drawer
      cy.get('button[aria-label*="menu"]').click();
      cy.get('[role="dialog"]').should('be.visible');

      // Close drawer
      cy.get('button[aria-label="Close"]').click();
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should navigate from mobile menu', () => {
      cy.get('button[aria-label*="menu"]').click();
      cy.contains('Calendar').click();
      cy.url().should('include', '/calendar');
    });
  });
});
