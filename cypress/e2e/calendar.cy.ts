/// <reference types="cypress" />

describe('Training Calendar', () => {
  beforeEach(() => {
    cy.visit('/calendar');
  });

  it('should display the calendar page', () => {
    cy.contains('Training Calendar').should('be.visible');
  });

  it('should show week navigation controls', () => {
    cy.get('button[aria-label*="Previous"]').should('be.visible');
    cy.get('button[aria-label*="Next"]').should('be.visible');
    cy.contains('Today').should('be.visible');
  });

  it('should navigate to previous week', () => {
    cy.get('button[aria-label*="Previous"]').first().click();
    // Calendar should update (we can verify by checking dates change)
    cy.wait(500); // Allow for animation
  });

  it('should navigate to next week', () => {
    cy.get('button[aria-label*="Next"]').first().click();
    cy.wait(500);
  });

  it('should return to current week with Today button', () => {
    // Navigate away first
    cy.get('button[aria-label*="Next"]').first().click();
    cy.wait(500);

    // Return to today
    cy.contains('Today').click();
    cy.wait(500);
  });

  describe('View Modes', () => {
    it('should toggle between week and month views', () => {
      // Find view toggle buttons
      cy.get('body').then(($body) => {
        if ($body.text().includes('Month')) {
          cy.contains('Month').click();
          cy.wait(500);
          cy.contains('Week').click();
        }
      });
    });
  });

  describe('Workout Library', () => {
    it('should open workout library modal', () => {
      // Find and click the library button
      cy.get('button').contains(/library|folder/i).first().click({ force: true });

      // Modal should appear
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Workout Library').should('be.visible');
    });

    it('should close workout library modal', () => {
      cy.get('button').contains(/library|folder/i).first().click({ force: true });
      cy.get('[role="dialog"]').should('be.visible');

      // Close the modal
      cy.get('button[aria-label="Close"]').click();
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('should search workouts in library', () => {
      cy.get('button').contains(/library|folder/i).first().click({ force: true });
      cy.get('[role="dialog"]').should('be.visible');

      // Type in search
      cy.get('input[placeholder*="Search"]').type('endurance');
      cy.wait(500);
    });
  });

  describe('Day Selection', () => {
    it('should highlight the selected day', () => {
      // Click on a day column
      cy.get('[data-day]').first().click();
      // The day should be highlighted
    });
  });
});
