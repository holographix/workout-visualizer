/// <reference types="cypress" />

describe('Athlete Dashboard', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the dashboard page', () => {
    // Dashboard should load with main content areas
    cy.contains('This Week').should('be.visible');
  });

  it('should display weekly summary card', () => {
    // Weekly summary should show workout count and hours
    cy.contains('This Week').should('be.visible');
    cy.contains('Workouts').should('be.visible');
  });

  it('should display today\'s workout section', () => {
    // Today's workout or rest day message
    cy.get('body').then(($body) => {
      if ($body.text().includes("Today's Workout")) {
        cy.contains("Today's Workout").should('be.visible');
      } else {
        cy.contains('Rest Day').should('be.visible');
      }
    });
  });

  it('should display upcoming workouts', () => {
    cy.contains('Coming Up').should('be.visible');
  });

  describe('Week Progress', () => {
    it('should show week completion progress', () => {
      // Progress bar or completion indicator
      cy.get('[role="progressbar"]').should('exist');
    });
  });

  describe('Goal Countdown', () => {
    it('should display goal countdown section', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Next Goal')) {
          cy.contains('Next Goal').should('be.visible');
        } else {
          cy.contains('Set a goal').should('be.visible');
        }
      });
    });
  });
});
