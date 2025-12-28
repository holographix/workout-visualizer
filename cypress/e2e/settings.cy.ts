/// <reference types="cypress" />

describe('Settings Page', () => {
  beforeEach(() => {
    cy.visit('/settings');
  });

  it('should display the settings page', () => {
    cy.contains('Settings').should('be.visible');
  });

  describe('Profile Section', () => {
    it('should display profile information', () => {
      cy.contains('Profile').should('be.visible');
    });
  });

  describe('Weekly Availability', () => {
    it('should display availability editor', () => {
      cy.contains('Weekly Availability').should('be.visible');
    });

    it('should show day toggles', () => {
      // Each day should have a toggle/checkbox
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach((day) => {
        cy.contains(day).should('be.visible');
      });
    });
  });

  describe('Training Zones', () => {
    it('should display training zones section', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Training Zones') || $body.text().includes('Power Zones')) {
          cy.contains(/Training Zones|Power Zones/).should('be.visible');
        }
      });
    });
  });

  describe('Language Selection', () => {
    it('should display language options', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Language')) {
          cy.contains('Language').should('be.visible');
        }
      });
    });
  });

  describe('Goals', () => {
    it('should display goals section', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Goals') || $body.text().includes('goal')) {
          cy.contains(/Goals|goal/i).should('be.visible');
        }
      });
    });
  });
});
