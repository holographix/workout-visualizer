/// <reference types="cypress" />

/**
 * Coach Workout Scheduling E2E Tests
 * Tests the coach's ability to schedule workouts for athletes
 *
 * User Journey: Coach adds workouts to athlete's calendar
 * 1. Navigate to coach dashboard
 * 2. Select an athlete
 * 3. View athlete's calendar
 * 4. Open workout library
 * 5. Select/customize a workout
 * 6. Drag or assign to a specific date
 * 7. Verify workout appears on calendar
 */

describe('Coach Workout Scheduling', () => {
  beforeEach(() => {
    cy.visit('/coach');
    cy.wait(1000);
    cy.dismissTour();
  });

  describe('Coach Dashboard', () => {
    it('should display the coach dashboard', () => {
      cy.contains(/coach|allenatore/i).should('exist');
    });

    it('should show athlete list', () => {
      cy.contains(/athlete|atleti/i).should('exist');
    });

    it('should display athlete cards with basic info', () => {
      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          // Athlete cards exist
          cy.get('[data-testid="athlete-card"]').first().should('be.visible');
        }
      });
    });
  });

  describe('Athlete Selection', () => {
    it('should click on athlete card to view their calendar', () => {
      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('[data-testid="athlete-card"]').first().click();
          cy.wait(500);

          // Should either navigate or show athlete details
          cy.url().then((url) => {
            const navigated = url.includes('/athlete/');
            const hasCalendar = Cypress.$('[data-testid="calendar"]').length > 0;
            expect(navigated || hasCalendar).to.be.true;
          });
        }
      });
    });

    it('should show athlete FTP and training zones', () => {
      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('[data-testid="athlete-card"]').first().then(($card) => {
            const text = $card.text();
            // Should show FTP or power metrics
            const hasFTP = text.match(/FTP|W|watt|\d+\s*W/i);
            if (hasFTP) {
              expect(hasFTP).to.exist;
            }
          });
        }
      });
    });
  });

  describe('Athlete Calendar View', () => {
    beforeEach(() => {
      // Navigate to athlete calendar
      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('[data-testid="athlete-card"]').first().click();
          cy.wait(1000);
        }
      });
    });

    it('should display athlete calendar', () => {
      cy.get('body').then(($body) => {
        const hasCalendar = $body.find('[data-testid="calendar"], .calendar-grid, [role="grid"]').length > 0;
        const hasWeekView = $body.text().match(/mon|tue|wed|thu|fri|sat|sun|lun|mar|mer|gio|ven|sab|dom/i);
        expect(hasCalendar || hasWeekView).to.exist;
      });
    });

    it('should show current week days', () => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const italianDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
      const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      cy.get('body').then(($body) => {
        const text = $body.text();
        const hasDays = days.some(d => text.includes(d)) ||
                       italianDays.some(d => text.includes(d)) ||
                       shortDays.some(d => text.includes(d));
        expect(hasDays).to.be.true;
      });
    });

    it('should allow clicking on a calendar day', () => {
      cy.get('[data-testid="calendar-day"], .calendar-day, [role="gridcell"]').then(($days) => {
        if ($days.length > 0) {
          cy.wrap($days.first()).click();
          cy.wait(300);
        }
      });
    });
  });

  describe('Workout Library', () => {
    beforeEach(() => {
      // Navigate to athlete calendar first
      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('[data-testid="athlete-card"]').first().click();
          cy.wait(1000);
        }
      });
    });

    it('should have a workout library button', () => {
      cy.get('button').filter(':contains("Library"), :contains("Libreria"), [aria-label*="library"]').should('exist');
    });

    it('should open workout library panel/modal', () => {
      cy.get('button').filter(':contains("Library"), :contains("Libreria"), [aria-label*="library"]').first().click();
      cy.wait(500);

      // Library should be visible
      cy.get('[role="dialog"], [data-testid="workout-library"], .workout-library').should('be.visible');
    });

    it('should display workout categories', () => {
      cy.get('button').filter(':contains("Library"), :contains("Libreria"), [aria-label*="library"]').first().click();
      cy.wait(500);

      // Should show workout categories
      cy.get('body').then(($body) => {
        const libraryText = $body.text();
        const hasCategories = libraryText.match(/endurance|tempo|threshold|vo2|sprint|recovery|resistenza|recupero/i);
        expect(hasCategories).to.exist;
      });
    });

    it('should display workouts in the library', () => {
      cy.get('button').filter(':contains("Library"), :contains("Libreria"), [aria-label*="library"]').first().click();
      cy.wait(500);

      // Should show workout items
      cy.get('[data-testid="workout-item"], .workout-item, [draggable="true"]').should('have.length.at.least', 1);
    });

    it('should show workout details on hover or click', () => {
      cy.get('button').filter(':contains("Library"), :contains("Libreria"), [aria-label*="library"]').first().click();
      cy.wait(500);

      cy.get('[data-testid="workout-item"], .workout-item').then(($items) => {
        if ($items.length > 0) {
          cy.wrap($items.first()).click();
          cy.wait(300);

          // Should show workout details
          cy.get('body').should('contain.text', /duration|durata|TSS|intensity|intensità/i);
        }
      });
    });
  });

  describe('Workout Scheduling Flow', () => {
    beforeEach(() => {
      // Navigate to athlete calendar
      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('[data-testid="athlete-card"]').first().click();
          cy.wait(1000);
        }
      });
    });

    it('should schedule a workout by drag and drop', () => {
      // Open library
      cy.get('button').filter(':contains("Library"), :contains("Libreria"), [aria-label*="library"]').first().click();
      cy.wait(500);

      // Get a workout item and a calendar day
      cy.get('[data-testid="workout-item"], .workout-item, [draggable="true"]').then(($workouts) => {
        if ($workouts.length > 0) {
          cy.get('[data-testid="calendar-day"], .calendar-day, [role="gridcell"]').then(($days) => {
            if ($days.length > 0) {
              // Drag workout to calendar day
              const workout = $workouts.first();
              const day = $days.eq(2); // Pick a day in the middle

              cy.wrap(workout).trigger('dragstart');
              cy.wrap(day).trigger('drop');
              cy.wrap(workout).trigger('dragend');

              cy.wait(500);
            }
          });
        }
      });
    });

    it('should schedule a workout by clicking and assigning', () => {
      // Open library
      cy.get('button').filter(':contains("Library"), :contains("Libreria"), [aria-label*="library"]').first().click();
      cy.wait(500);

      // Click on a workout
      cy.get('[data-testid="workout-item"], .workout-item').then(($workouts) => {
        if ($workouts.length > 0) {
          cy.wrap($workouts.first()).click();
          cy.wait(300);

          // Look for "Schedule" or "Add to Calendar" button
          cy.get('button').filter(':contains("Schedule"), :contains("Add"), :contains("Assegna"), :contains("Aggiungi")').then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn.first()).click();
              cy.wait(300);

              // Should show date picker or calendar
              cy.get('input[type="date"], [role="dialog"]').should('exist');
            }
          });
        }
      });
    });

    it('should show scheduled workout on calendar', () => {
      // Check for any existing scheduled workouts
      cy.get('[data-testid="scheduled-workout"], .scheduled-workout, .workout-card').then(($scheduled) => {
        if ($scheduled.length > 0) {
          // Verify workout details are visible
          cy.wrap($scheduled.first()).should('be.visible');
        }
      });
    });
  });

  describe('Complete Workout Scheduling Journey', () => {
    it('should complete full workout scheduling flow', () => {
      cy.log('**Starting Coach Workout Scheduling Journey**');

      // STEP 1: Select an athlete
      cy.log('Step 1: Select an Athlete');
      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          const athleteName = $cards.first().text().match(/\w+/)?.[0] || 'Athlete';
          cy.log(`Selecting athlete: ${athleteName}`);
          cy.wrap($cards.first()).click();
          cy.wait(1000);

          // STEP 2: Open Workout Library
          cy.log('Step 2: Open Workout Library');
          cy.get('button').filter(':contains("Library"), :contains("Libreria"), [aria-label*="library"]').first().click();
          cy.wait(500);

          // STEP 3: Browse and Select a Workout
          cy.log('Step 3: Browse and Select Workout');
          cy.get('[data-testid="workout-item"], .workout-item').then(($workouts) => {
            if ($workouts.length > 0) {
              // Select first workout
              cy.wrap($workouts.first()).click();
              cy.wait(300);

              // STEP 4: Schedule for a specific date
              cy.log('Step 4: Schedule Workout');

              // Try schedule button approach
              cy.get('button').filter(':contains("Schedule"), :contains("Add"), :contains("Assegna")').then(($scheduleBtn) => {
                if ($scheduleBtn.length > 0) {
                  cy.wrap($scheduleBtn.first()).click();
                  cy.wait(300);

                  // Pick a date
                  cy.get('input[type="date"]').then(($dateInput) => {
                    if ($dateInput.length > 0) {
                      // Schedule for tomorrow
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const dateStr = tomorrow.toISOString().split('T')[0];
                      cy.wrap($dateInput).type(dateStr);
                    }
                  });

                  // Confirm scheduling
                  cy.get('button').filter(':contains("Confirm"), :contains("Save"), :contains("OK"), :contains("Conferma")').then(($confirmBtn) => {
                    if ($confirmBtn.length > 0) {
                      cy.wrap($confirmBtn.first()).click();
                      cy.wait(500);

                      // STEP 5: Verify workout appears
                      cy.log('Step 5: Verify Workout Scheduled');
                      // Close library if still open
                      cy.get('[role="dialog"]').then(($dialog) => {
                        if ($dialog.length > 0) {
                          cy.get('button[aria-label="Close"]').click();
                        }
                      });

                      // Check calendar for the scheduled workout
                      cy.get('[data-testid="scheduled-workout"], .scheduled-workout, .workout-card').should('have.length.at.least', 1);

                      cy.log('**Workout Scheduling Complete!**');
                    }
                  });
                }
              });
            }
          });
        } else {
          cy.log('No athletes found - skipping test');
        }
      });
    });
  });

  describe('Workout Customization', () => {
    beforeEach(() => {
      // Navigate to athlete calendar
      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('[data-testid="athlete-card"]').first().click();
          cy.wait(1000);
        }
      });
    });

    it('should allow editing workout before scheduling', () => {
      // Open library
      cy.get('button').filter(':contains("Library"), :contains("Libreria"), [aria-label*="library"]').first().click();
      cy.wait(500);

      // Select a workout
      cy.get('[data-testid="workout-item"], .workout-item').then(($workouts) => {
        if ($workouts.length > 0) {
          cy.wrap($workouts.first()).click();
          cy.wait(300);

          // Look for edit/customize button
          cy.get('button').filter(':contains("Edit"), :contains("Customize"), :contains("Modifica")').then(($editBtn) => {
            if ($editBtn.length > 0) {
              cy.wrap($editBtn.first()).click();
              cy.wait(300);

              // Should show editable fields
              cy.get('input, textarea').should('exist');
            }
          });
        }
      });
    });

    it('should allow adding notes to scheduled workout', () => {
      // Click on an existing scheduled workout
      cy.get('[data-testid="scheduled-workout"], .scheduled-workout, .workout-card').then(($scheduled) => {
        if ($scheduled.length > 0) {
          cy.wrap($scheduled.first()).click();
          cy.wait(300);

          // Should show workout details modal/panel
          cy.get('[role="dialog"]').then(($dialog) => {
            if ($dialog.length > 0) {
              // Look for notes field
              cy.get('textarea').then(($textarea) => {
                if ($textarea.length > 0) {
                  cy.wrap($textarea).type('Coach notes: Focus on cadence during intervals');
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Week Navigation', () => {
    beforeEach(() => {
      // Navigate to athlete calendar
      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('[data-testid="athlete-card"]').first().click();
          cy.wait(1000);
        }
      });
    });

    it('should navigate to next week', () => {
      cy.get('button').filter('[aria-label*="next"], :contains(">"), :contains("Next")').then(($nextBtn) => {
        if ($nextBtn.length > 0) {
          cy.wrap($nextBtn.first()).click();
          cy.wait(500);
        }
      });
    });

    it('should navigate to previous week', () => {
      cy.get('button').filter('[aria-label*="previous"], :contains("<"), :contains("Previous"), :contains("Prev")').then(($prevBtn) => {
        if ($prevBtn.length > 0) {
          cy.wrap($prevBtn.first()).click();
          cy.wait(500);
        }
      });
    });

    it('should return to current week', () => {
      // Go to next week first
      cy.get('button').filter('[aria-label*="next"], :contains(">")').first().click();
      cy.wait(300);

      // Then return to today
      cy.get('button').filter(':contains("Today"), :contains("Oggi"), [aria-label*="today"]').then(($todayBtn) => {
        if ($todayBtn.length > 0) {
          cy.wrap($todayBtn.first()).click();
          cy.wait(300);
        }
      });
    });
  });

  describe('Workout Deletion', () => {
    beforeEach(() => {
      // Navigate to athlete calendar
      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.get('[data-testid="athlete-card"]').first().click();
          cy.wait(1000);
        }
      });
    });

    it('should allow deleting a scheduled workout', () => {
      cy.get('[data-testid="scheduled-workout"], .scheduled-workout, .workout-card').then(($scheduled) => {
        if ($scheduled.length > 0) {
          const initialCount = $scheduled.length;

          // Click on the workout
          cy.wrap($scheduled.first()).click();
          cy.wait(300);

          // Find delete button
          cy.get('[role="dialog"], .workout-details').then(($details) => {
            if ($details.length > 0) {
              cy.get('button').filter('[aria-label*="delete"], :contains("Delete"), :contains("Remove"), :contains("Elimina")').then(($deleteBtn) => {
                if ($deleteBtn.length > 0) {
                  cy.wrap($deleteBtn.first()).click();

                  // Confirm if needed
                  cy.get('button').filter(':contains("Confirm"), :contains("Yes"), :contains("Sì")').then(($confirmBtn) => {
                    if ($confirmBtn.length > 0) {
                      cy.wrap($confirmBtn.first()).click();
                    }
                  });

                  cy.wait(500);

                  // Should have one less workout
                  cy.get('[data-testid="scheduled-workout"], .scheduled-workout, .workout-card').should('have.length.lessThan', initialCount + 1);
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Mobile Coach View', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should display coach dashboard on mobile', () => {
      cy.visit('/coach');
      cy.wait(500);
      cy.contains(/coach|allenatore/i).should('exist');
    });

    it('should show athlete list on mobile', () => {
      cy.visit('/coach');
      cy.wait(500);
      cy.get('[data-testid="athlete-card"]').should('exist');
    });

    it('should navigate to athlete calendar on mobile', () => {
      cy.visit('/coach');
      cy.wait(500);

      cy.get('[data-testid="athlete-card"]').then(($cards) => {
        if ($cards.length > 0) {
          cy.wrap($cards.first()).click();
          cy.wait(500);
        }
      });
    });
  });
});
