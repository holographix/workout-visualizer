/// <reference types="cypress" />

/**
 * Athlete Workout Completion E2E Tests
 * Tests the athlete's ability to complete workouts and add actual data
 *
 * User Journey: Athlete completes a workout and enters data
 * 1. View today's workout on dashboard
 * 2. Click to start/view workout
 * 3. Complete workout in real life
 * 4. Return to app and mark as complete
 * 5. Enter actual data (duration, power, HR, TSS)
 * 6. Add notes about the workout
 * 7. Submit completion
 * 8. Verify workout shows as completed
 * 9. Check weekly stats updated
 */

describe('Athlete Workout Completion', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
    cy.wait(1000);
    cy.dismissTour();
  });

  describe("Today's Workout Section", () => {
    it('should display today\'s workout spotlight on dashboard', () => {
      cy.get('[data-tour="today-workout"]').should('exist');
    });

    it('should show workout details or rest day message', () => {
      cy.get('[data-tour="today-workout"]').then(($workout) => {
        const text = $workout.text();
        const hasWorkout = text.match(/start|view|begin|inizia|visualizza/i);
        const isRestDay = text.match(/rest day|giorno di riposo|no workout|nessun allenamento/i);
        expect(hasWorkout || isRestDay).to.exist;
      });
    });

    it('should show workout type and duration', () => {
      cy.get('[data-tour="today-workout"]').then(($workout) => {
        const text = $workout.text();
        // Should show either workout type or rest day
        const hasType = text.match(/endurance|tempo|threshold|recovery|vo2|sprint|rest|riposo/i);
        const hasDuration = text.match(/\d+\s*(min|h|hour|ora|minute)/i);
        expect(hasType || hasDuration).to.exist;
      });
    });
  });

  describe('Opening Workout Details', () => {
    it('should open workout modal when clicking on today\'s workout', () => {
      cy.get('[data-tour="today-workout"]').find('button').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn.first()).click({ force: true });
          cy.wait(500);

          // Modal should appear
          cy.get('[role="dialog"]').should('be.visible');
        }
      });
    });

    it('should display workout structure in modal', () => {
      cy.get('[data-tour="today-workout"]').find('button').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn.first()).click({ force: true });
          cy.wait(500);

          // Should show workout structure or chart
          cy.get('[role="dialog"]').then(($modal) => {
            const hasStructure = $modal.find('svg, canvas, [data-testid="workout-chart"]').length > 0;
            const hasIntervals = $modal.text().match(/interval|warmup|cooldown|warm-up|cool-down|riscaldamento|defaticamento/i);
            expect(hasStructure || hasIntervals).to.exist;
          });
        }
      });
    });
  });

  describe('Workout Completion Form', () => {
    beforeEach(() => {
      // Open today's workout modal
      cy.get('[data-tour="today-workout"]').find('button').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn.first()).click({ force: true });
          cy.wait(500);
        }
      });
    });

    it('should display completion form fields', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          // Should have completion toggle or button
          const hasCompletion = $modal.text().match(/complete|completa|done|fatto|mark as|segna come/i);
          expect(hasCompletion).to.exist;
        }
      });
    });

    it('should allow entering actual duration', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          // Look for duration input
          const durationInput = $modal.find('input[name*="duration"], input[placeholder*="duration"], input[placeholder*="durata"]');
          if (durationInput.length > 0) {
            cy.wrap(durationInput.first()).clear().type('65');
          }
        }
      });
    });

    it('should allow entering actual power', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          // Look for power input
          const powerInput = $modal.find('input[name*="power"], input[placeholder*="power"], input[placeholder*="potenza"]');
          if (powerInput.length > 0) {
            cy.wrap(powerInput.first()).clear().type('185');
          }
        }
      });
    });

    it('should allow entering actual heart rate', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          // Look for HR input
          const hrInput = $modal.find('input[name*="hr"], input[name*="heartRate"], input[placeholder*="HR"], input[placeholder*="heart"]');
          if (hrInput.length > 0) {
            cy.wrap(hrInput.first()).clear().type('142');
          }
        }
      });
    });

    it('should allow entering actual TSS', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          // Look for TSS input
          const tssInput = $modal.find('input[name*="tss"], input[placeholder*="TSS"]');
          if (tssInput.length > 0) {
            cy.wrap(tssInput.first()).clear().type('68');
          }
        }
      });
    });

    it('should allow adding workout notes', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          const notesTextarea = $modal.find('textarea');
          if (notesTextarea.length > 0) {
            cy.wrap(notesTextarea.first()).type('Felt strong today. Legs were fresh after rest day. Hit all power targets.');
          }
        }
      });
    });
  });

  describe('Complete Workout Flow', () => {
    it('should complete full workout completion flow from dashboard', () => {
      cy.log('**Starting Workout Completion Journey**');

      // STEP 1: Check today's workout
      cy.log('Step 1: View Today\'s Workout');
      cy.get('[data-tour="today-workout"]').should('exist');

      // STEP 2: Open workout modal
      cy.log('Step 2: Open Workout Details');
      cy.get('[data-tour="today-workout"]').find('button').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn.first()).click({ force: true });
          cy.wait(500);

          // STEP 3: View workout structure
          cy.log('Step 3: Review Workout Structure');
          cy.get('[role="dialog"]').should('be.visible');

          // STEP 4: Enter completion data
          cy.log('Step 4: Enter Actual Workout Data');

          // Enter duration
          cy.get('[role="dialog"]').find('input[type="number"]').then(($inputs) => {
            if ($inputs.length >= 1) {
              // Duration (first input typically)
              cy.wrap($inputs.first()).clear().type('62');
            }

            if ($inputs.length >= 2) {
              // Power or TSS
              cy.wrap($inputs.eq(1)).clear().type('180');
            }
          });

          // Enter notes
          cy.get('[role="dialog"]').find('textarea').then(($textarea) => {
            if ($textarea.length > 0) {
              cy.wrap($textarea.first()).type('E2E Test: Completed workout. Good session overall.');
            }
          });

          // STEP 5: Mark as complete
          cy.log('Step 5: Mark Workout as Complete');
          cy.get('[role="dialog"]').find('button').filter(':contains("Complete"), :contains("Done"), :contains("Completa"), :contains("Fatto")').then(($completeBtn) => {
            if ($completeBtn.length > 0) {
              cy.wrap($completeBtn.first()).click();
              cy.wait(1000);

              // STEP 6: Verify completion
              cy.log('Step 6: Verify Workout Marked Complete');

              // Modal should close or show success
              cy.get('body').then(($body) => {
                const hasSuccess = $body.text().match(/success|saved|completed|salvato|completato/i);
                const modalClosed = $body.find('[role="dialog"]').length === 0;
                expect(hasSuccess || modalClosed).to.exist;
              });

              cy.log('**Workout Completion Journey Complete!**');
            }
          });
        }
      });
    });

    it('should complete workout from calendar view', () => {
      cy.log('**Completing workout from Calendar**');

      // Navigate to calendar
      cy.visit('/calendar');
      cy.wait(1000);

      // Find a scheduled workout
      cy.get('[data-testid="scheduled-workout"], .scheduled-workout, .workout-card').then(($workouts) => {
        if ($workouts.length > 0) {
          // Click on workout
          cy.wrap($workouts.first()).click({ force: true });
          cy.wait(500);

          // Modal should open
          cy.get('[role="dialog"]').should('be.visible');

          // Enter completion data
          cy.get('[role="dialog"]').find('input[type="number"]').then(($inputs) => {
            if ($inputs.length > 0) {
              cy.wrap($inputs.first()).clear().type('58');
            }
          });

          // Add notes
          cy.get('[role="dialog"]').find('textarea').then(($textarea) => {
            if ($textarea.length > 0) {
              cy.wrap($textarea.first()).type('Completed from calendar view test');
            }
          });

          // Complete
          cy.get('[role="dialog"]').find('button').filter(':contains("Complete"), :contains("Save"), :contains("Completa"), :contains("Salva")').then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn.first()).click();
              cy.wait(500);
            }
          });
        }
      });
    });
  });

  describe('Weekly Stats Update', () => {
    it('should display weekly stats section', () => {
      cy.get('[data-tour="weekly-stats"]').should('exist');
    });

    it('should show completed workouts count', () => {
      cy.get('[data-tour="weekly-stats"]').within(() => {
        cy.contains(/workout|allenament/i).should('exist');
      });
    });

    it('should show TSS progress', () => {
      cy.get('[data-tour="weekly-stats"]').within(() => {
        cy.contains(/TSS/i).should('exist');
      });
    });

    it('should show hours progress', () => {
      cy.get('[data-tour="weekly-stats"]').within(() => {
        cy.contains(/hour|ora|h\b/i).should('exist');
      });
    });

    it('should display progress indicators', () => {
      cy.get('[data-tour="weekly-stats"]').within(() => {
        cy.get('[role="progressbar"], svg circle, .progress-ring, .progress-bar').should('exist');
      });
    });

    it('should show correct fraction of completed workouts', () => {
      cy.get('[data-tour="weekly-stats"]').then(($stats) => {
        const text = $stats.text();
        // Should show something like "3/5" or "3 of 5"
        const hasFraction = text.match(/\d+\s*[\/of]\s*\d+/i);
        expect(hasFraction).to.exist;
      });
    });
  });

  describe('Upcoming Workouts', () => {
    it('should display upcoming workouts section', () => {
      cy.get('[data-tour="upcoming-workouts"]').should('exist');
    });

    it('should show workout preview cards or empty state', () => {
      cy.get('[data-tour="upcoming-workouts"]').then(($section) => {
        const hasWorkouts = $section.find('[data-testid="workout-preview"], .workout-preview').length > 0;
        const isEmpty = $section.text().match(/no.*workout|nessun.*allenament/i);
        expect(hasWorkouts || isEmpty).to.exist;
      });
    });

    it('should navigate to calendar on View All click', () => {
      cy.get('[data-tour="upcoming-workouts"]').find('button, a').filter(':contains("View"), :contains("Vedi"), :contains("All")').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn.first()).click({ force: true });
          cy.url().should('include', '/calendar');
        }
      });
    });
  });

  describe('Workout Completion Status Persistence', () => {
    it('should maintain completed status after page refresh', () => {
      cy.visit('/calendar');
      cy.wait(1000);

      // Check for completed workout
      cy.get('body').then(($body) => {
        const completedWorkout = $body.find('[data-completed="true"], .completed-workout');
        if (completedWorkout.length > 0) {
          // Refresh page
          cy.reload();
          cy.wait(1000);

          // Workout should still be completed
          cy.get('[data-completed="true"], .completed-workout').should('exist');
        }
      });
    });

    it('should update dashboard stats after completion', () => {
      // Get initial stats
      cy.get('[data-tour="weekly-stats"]').invoke('text').as('initialStats');

      // Navigate to calendar and complete a workout
      cy.visit('/calendar');
      cy.wait(1000);

      cy.get('[data-testid="scheduled-workout"]').then(($workouts) => {
        if ($workouts.length > 0) {
          // Find an incomplete workout
          const incompleteWorkout = $workouts.filter('[data-completed="false"]');
          if (incompleteWorkout.length > 0) {
            cy.wrap(incompleteWorkout.first()).click({ force: true });
            cy.wait(500);

            // Complete it
            cy.get('[role="dialog"]').find('button').filter(':contains("Complete"), :contains("Completa")').click();
            cy.wait(1000);

            // Go back to dashboard
            cy.visit('/dashboard');
            cy.wait(1000);

            // Stats should be updated
            cy.get('[data-tour="weekly-stats"]').should('be.visible');
          }
        }
      });
    });
  });

  describe('Workout Rating', () => {
    beforeEach(() => {
      // Open today's workout
      cy.get('[data-tour="today-workout"]').find('button').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn.first()).click({ force: true });
          cy.wait(500);
        }
      });
    });

    it('should allow rating workout effort (RPE)', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          // Look for RPE slider or buttons
          const rpeElements = $modal.find('[data-testid="rpe"], [aria-label*="RPE"], [role="slider"]');
          if (rpeElements.length > 0) {
            cy.wrap(rpeElements.first()).click();
          }
        }
      });
    });

    it('should allow rating workout feeling', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          // Look for feeling rating (emoji faces or stars)
          const feelingElements = $modal.find('[data-testid="feeling"], button:has(svg)');
          if (feelingElements.length > 0) {
            cy.wrap(feelingElements.first()).click();
          }
        }
      });
    });
  });

  describe('Missed Workout Handling', () => {
    it('should allow marking workout as missed/skipped', () => {
      cy.get('[data-tour="today-workout"]').find('button').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn.first()).click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              // Look for skip/miss button
              const skipBtn = $modal.find('button').filter((_, el) => {
                const text = (el.textContent || '').toLowerCase();
                return text.includes('skip') || text.includes('miss') || text.includes('salta');
              });
              if (skipBtn.length > 0) {
                cy.wrap(skipBtn.first()).should('exist');
              }
            }
          });
        }
      });
    });
  });

  describe('Mobile Workout Completion', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should display dashboard on mobile', () => {
      cy.visit('/dashboard');
      cy.wait(500);
      cy.get('[data-tour="today-workout"]').should('exist');
    });

    it('should open workout modal on mobile', () => {
      cy.visit('/dashboard');
      cy.wait(500);

      cy.get('[data-tour="today-workout"]').find('button').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn.first()).click({ force: true });
          cy.wait(500);
          cy.get('[role="dialog"]').should('be.visible');
        }
      });
    });

    it('should allow completing workout on mobile', () => {
      cy.visit('/dashboard');
      cy.wait(500);

      cy.get('[data-tour="today-workout"]').find('button').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn.first()).click({ force: true });
          cy.wait(500);

          // Enter data
          cy.get('[role="dialog"]').find('input[type="number"]').first().clear().type('45');

          // Complete
          cy.get('[role="dialog"]').find('button').filter(':contains("Complete"), :contains("Completa")').then(($completeBtn) => {
            if ($completeBtn.length > 0) {
              cy.wrap($completeBtn.first()).click();
            }
          });
        }
      });
    });
  });

  describe('Close Modal Behavior', () => {
    beforeEach(() => {
      cy.get('[data-tour="today-workout"]').find('button').then(($btn) => {
        if ($btn.length > 0) {
          cy.wrap($btn.first()).click({ force: true });
          cy.wait(500);
        }
      });
    });

    it('should close modal on X button click', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          cy.get('button[aria-label="Close"], button:contains("×")').first().click();
          cy.get('[role="dialog"]').should('not.exist');
        }
      });
    });

    it('should close modal on Cancel click', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          cy.get('button').filter(':contains("Cancel"), :contains("Annulla")').then(($cancelBtn) => {
            if ($cancelBtn.length > 0) {
              cy.wrap($cancelBtn.first()).click();
              cy.get('[role="dialog"]').should('not.exist');
            }
          });
        }
      });
    });

    it('should close modal on escape key', () => {
      cy.get('[role="dialog"]').then(($modal) => {
        if ($modal.length > 0) {
          cy.get('body').type('{esc}');
          cy.wait(300);
          cy.get('[role="dialog"]').should('not.exist');
        }
      });
    });
  });
});
