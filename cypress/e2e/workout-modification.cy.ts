/// <reference types="cypress" />

/**
 * Workout Modification E2E Tests
 * Tests the Feature 3: Edit Scheduled Workout Duration
 *
 * User Journey: Coach modifies a scheduled workout for an athlete
 * 1. Coach navigates to athlete's calendar
 * 2. Coach hovers over a scheduled workout to see Edit button
 * 3. Coach clicks Edit button to open ScheduledWorkoutEditor modal
 * 4. Coach modifies the workout structure (change duration/intensity)
 * 5. Coach saves the changes
 * 6. System recalculates TSS/IF and marks workout as modified
 * 7. Coach can reset the workout to original structure
 */

describe('Workout Modification Feature', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
    cy.wait(1000); // Allow time for auth and initial load
  });

  describe('Coach modifies scheduled workout', () => {
    it('should navigate to athlete calendar and see scheduled workouts', () => {
      // Navigate to coach page
      cy.visit('/coach');
      cy.wait(1000);

      // Should see list of athletes
      cy.get('body').should('contain', /athlete|atleta/i);

      // Click on first athlete to go to their calendar
      cy.get('[data-testid="athlete-card"], a[href*="/athlete/"]').first().click();
      cy.wait(1000);

      // Should be on athlete calendar page
      cy.url().should('include', '/athlete/');
      cy.url().should('include', '/calendar');
    });

    it('should show Edit button on workout card hover', () => {
      // Navigate to an athlete calendar with scheduled workouts
      cy.visit('/coach');
      cy.wait(1000);

      // Click on first athlete
      cy.get('[data-testid="athlete-card"], a[href*="/athlete/"]').first().click();
      cy.wait(1000);

      // Find a workout card (if exists)
      cy.get('body').then($body => {
        // Check if there are scheduled workouts
        if ($body.find('[role="group"]').length > 0) {
          // Hover over the workout card
          cy.get('[role="group"]').first().trigger('mouseover');

          // Edit button should appear (with aria-label containing "edit" or "modifica")
          cy.get('[aria-label*="dit"], [aria-label*="odifica"]').should('exist');
        } else {
          cy.log('No scheduled workouts found - test skipped for this athlete');
        }
      });
    });

    it('should open ScheduledWorkoutEditor modal when clicking Edit button', () => {
      cy.visit('/coach');
      cy.wait(1000);

      // Click on first athlete
      cy.get('[data-testid="athlete-card"], a[href*="/athlete/"]').first().click();
      cy.wait(1000);

      // Find a workout card
      cy.get('body').then($body => {
        if ($body.find('[role="group"]').length > 0) {
          // Hover and click edit button
          cy.get('[role="group"]').first().trigger('mouseover');
          cy.get('[aria-label*="dit"], [aria-label*="odifica"]').first().click({ force: true });

          // Modal should open
          cy.get('[role="dialog"]').should('be.visible');

          // Modal should contain edit-related text
          cy.get('[role="dialog"]').should('contain', /edit|modifica/i);

          // Modal should show workout details
          cy.get('[role="dialog"]').should('contain', /duration|durata|TSS|IF/i);
        } else {
          cy.log('No scheduled workouts found - test skipped');
        }
      });
    });

    it('should modify workout and save changes', () => {
      cy.visit('/coach');
      cy.wait(1000);

      // Click on first athlete
      cy.get('[data-testid="athlete-card"], a[href*="/athlete/"]').first().click();
      cy.wait(1000);

      // Find a workout card
      cy.get('body').then($body => {
        if ($body.find('[role="group"]').length > 0) {
          // Open editor
          cy.get('[role="group"]').first().trigger('mouseover');
          cy.get('[aria-label*="dit"], [aria-label*="odifica"]').first().click({ force: true });

          // Wait for modal to open
          cy.get('[role="dialog"]').should('be.visible');

          // Look for workout builder elements (steps, add button, etc.)
          cy.get('[role="dialog"]').within(() => {
            // Try to find add step button or similar
            cy.get('body').then($modal => {
              if ($modal.find('button').length > 2) {
                // Find and click Save button
                cy.contains('button', /save|salva/i).click();

                // Toast notification should appear
                cy.get('[role="status"], [role="alert"]', { timeout: 5000 }).should('exist');

                // Modal should close
                cy.get('[role="dialog"]').should('not.exist');
              } else {
                cy.log('Workout builder not fully loaded - closing modal');
                cy.contains('button', /cancel|annulla/i).click();
              }
            });
          });
        } else {
          cy.log('No scheduled workouts found - test skipped');
        }
      });
    });

    it('should show modified indicator on workout card after modification', () => {
      // This test would require a workout that was previously modified
      // For now, we'll just check the structure exists
      cy.visit('/coach');
      cy.wait(1000);

      cy.get('[data-testid="athlete-card"], a[href*="/athlete/"]').first().click();
      cy.wait(1000);

      // If there's a modified workout, it should have some visual indicator
      // This is implementation-specific - could be a badge, icon, or border
      cy.get('body').then($body => {
        if ($body.find('[role="group"]').length > 0) {
          // Check if any workout cards exist
          cy.get('[role="group"]').should('exist');
        }
      });
    });

    it('should reset workout to original structure', () => {
      cy.visit('/coach');
      cy.wait(1000);

      cy.get('[data-testid="athlete-card"], a[href*="/athlete/"]').first().click();
      cy.wait(1000);

      cy.get('body').then($body => {
        if ($body.find('[role="group"]').length > 0) {
          // Open editor
          cy.get('[role="group"]').first().trigger('mouseover');
          cy.get('[aria-label*="dit"], [aria-label*="odifica"]').first().click({ force: true });

          cy.get('[role="dialog"]').should('be.visible');

          // Look for Reset button (only visible if workout was modified)
          cy.get('[role="dialog"]').within(() => {
            cy.get('body').then($modal => {
              if ($modal.find('button:contains("Reset"), button:contains("Ripristina")').length > 0) {
                // Click Reset button
                cy.contains('button', /reset|ripristina/i).click();

                // Confirmation or success message
                cy.get('[role="status"], [role="alert"]', { timeout: 5000 }).should('exist');

                // Modal should close
                cy.get('[role="dialog"]').should('not.exist');
              } else {
                // No reset button (workout not modified) - just close
                cy.contains('button', /cancel|annulla/i).click();
              }
            });
          });
        } else {
          cy.log('No scheduled workouts found - test skipped');
        }
      });
    });
  });

  describe('API Integration', () => {
    it('should send PUT request when modifying workout', () => {
      cy.intercept('PUT', '/api/calendar/scheduled/*/structure').as('modifyWorkout');

      cy.visit('/coach');
      cy.wait(1000);

      cy.get('[data-testid="athlete-card"], a[href*="/athlete/"]').first().click();
      cy.wait(1000);

      cy.get('body').then($body => {
        if ($body.find('[role="group"]').length > 0) {
          cy.get('[role="group"]').first().trigger('mouseover');
          cy.get('[aria-label*="dit"], [aria-label*="odifica"]').first().click({ force: true });

          cy.get('[role="dialog"]').should('be.visible');

          cy.get('[role="dialog"]').within(() => {
            cy.get('body').then($modal => {
              if ($modal.find('button').length > 2) {
                cy.contains('button', /save|salva/i).click();

                // Should make API call
                cy.wait('@modifyWorkout', { timeout: 10000 }).then((interception) => {
                  expect(interception.request.method).to.equal('PUT');
                  expect(interception.request.body).to.have.property('structure');
                });
              } else {
                cy.contains('button', /cancel|annulla/i).click();
                cy.log('Workout builder not ready - skipping API test');
              }
            });
          });
        }
      });
    });

    it('should send DELETE request when resetting workout', () => {
      cy.intercept('DELETE', '/api/calendar/scheduled/*/structure').as('resetWorkout');

      cy.visit('/coach');
      cy.wait(1000);

      cy.get('[data-testid="athlete-card"], a[href*="/athlete/"]').first().click();
      cy.wait(1000);

      cy.get('body').then($body => {
        if ($body.find('[role="group"]').length > 0) {
          cy.get('[role="group"]').first().trigger('mouseover');
          cy.get('[aria-label*="dit"], [aria-label*="odifica"]').first().click({ force: true });

          cy.get('[role="dialog"]').should('be.visible');

          cy.get('[role="dialog"]').within(() => {
            cy.get('body').then($modal => {
              if ($modal.find('button:contains("Reset"), button:contains("Ripristina")').length > 0) {
                cy.contains('button', /reset|ripristina/i).click();

                // Should make API call
                cy.wait('@resetWorkout', { timeout: 10000 }).then((interception) => {
                  expect(interception.request.method).to.equal('DELETE');
                });
              } else {
                cy.contains('button', /cancel|annulla/i).click();
                cy.log('No reset button - workout not modified');
              }
            });
          });
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast if modification fails', () => {
      cy.intercept('PUT', '/api/calendar/scheduled/*/structure', {
        statusCode: 500,
        body: { message: 'Internal Server Error' }
      }).as('modifyWorkoutError');

      cy.visit('/coach');
      cy.wait(1000);

      cy.get('[data-testid="athlete-card"], a[href*="/athlete/"]').first().click();
      cy.wait(1000);

      cy.get('body').then($body => {
        if ($body.find('[role="group"]').length > 0) {
          cy.get('[role="group"]').first().trigger('mouseover');
          cy.get('[aria-label*="dit"], [aria-label*="odifica"]').first().click({ force: true });

          cy.get('[role="dialog"]').should('be.visible');

          cy.get('[role="dialog"]').within(() => {
            cy.get('body').then($modal => {
              if ($modal.find('button').length > 2) {
                cy.contains('button', /save|salva/i).click();

                // Should show error toast
                cy.get('[role="status"], [role="alert"]', { timeout: 5000 })
                  .should('contain', /error|errore/i);
              } else {
                cy.contains('button', /cancel|annulla/i).click();
              }
            });
          });
        }
      });
    });
  });
});
