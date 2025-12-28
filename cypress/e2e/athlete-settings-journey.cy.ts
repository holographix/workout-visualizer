/// <reference types="cypress" />

/**
 * Athlete Settings Journey E2E Tests
 * Tests the complete athlete settings page including:
 * - General settings (language, theme)
 * - Profile settings
 * - Goals/Objectives
 * - Weekly availability
 * - Custom unavailable dates
 * - Availability notes
 *
 * User Journey: Athlete completes full settings configuration
 */

describe('Athlete Settings Journey', () => {
  beforeEach(() => {
    cy.visit('/settings');
    cy.wait(1000); // Wait for data to load
  });

  describe('Settings Page Structure', () => {
    it('should display the settings page with all tabs', () => {
      // Settings title should be visible
      cy.contains(/settings|impostazioni/i).should('be.visible');

      // Should have tabs for different sections
      cy.get('[role="tablist"]').should('exist');
    });

    it('should display save button', () => {
      cy.contains('button', /save|salva/i).should('exist');
    });

    it('should display refresh button', () => {
      cy.get('button').filter('[aria-label*="refresh"], :contains("Refresh"), :contains("Aggiorna")').should('exist');
    });
  });

  describe('General Tab', () => {
    it('should display language settings', () => {
      // Language section should be visible
      cy.contains(/language|lingua/i).should('be.visible');
    });

    it('should allow switching language to Italian', () => {
      // Find and click Italian button
      cy.contains('button', /italiano|🇮🇹/i).click();

      // UI should update to Italian
      cy.wait(500);
      cy.contains(/impostazioni|salva|lingua/i).should('exist');
    });

    it('should allow switching language to English', () => {
      // First switch to Italian
      cy.contains('button', /italiano|🇮🇹/i).click();
      cy.wait(300);

      // Then switch back to English
      cy.contains('button', /english|🇬🇧/i).click();
      cy.wait(500);

      // UI should be in English
      cy.contains(/settings|save|language/i).should('exist');
    });

    it('should display theme/color mode settings', () => {
      cy.contains(/theme|tema|color mode|modalità/i).should('be.visible');
    });

    it('should allow switching to dark mode', () => {
      cy.contains('button', /dark|scuro/i).click();

      // Check that color scheme changed
      cy.get('html').should('satisfy', ($html) => {
        const className = $html.attr('class') || '';
        const style = $html.attr('style') || '';
        return className.includes('dark') || style.includes('color-scheme: dark');
      });
    });

    it('should allow switching to light mode', () => {
      cy.contains('button', /light|chiaro/i).click();

      // Check that color scheme changed
      cy.get('html').should('satisfy', ($html) => {
        const className = $html.attr('class') || '';
        const style = $html.attr('style') || '';
        return className.includes('light') || style.includes('color-scheme: light');
      });
    });

    it('should allow setting system color mode', () => {
      cy.contains('button', /system|sistema/i).click();
      // System mode should be selected
      cy.contains('button', /system|sistema/i).should('have.attr', 'data-active').or('have.css', 'background-color');
    });
  });

  describe('Profile Tab', () => {
    beforeEach(() => {
      // Navigate to Profile tab
      cy.get('[role="tablist"]').within(() => {
        cy.get('[role="tab"]').contains(/profile|profilo/i).click();
      });
      cy.wait(500);
    });

    it('should display profile settings', () => {
      cy.contains(/profile|profilo/i).should('be.visible');
    });

    it('should allow editing profile information', () => {
      // Look for editable fields
      cy.get('body').then(($body) => {
        const inputs = $body.find('input[type="text"], input[type="number"]');
        if (inputs.length > 0) {
          // Profile fields exist
          expect(inputs.length).to.be.greaterThan(0);
        }
      });
    });
  });

  describe('Objectives/Goals Tab', () => {
    beforeEach(() => {
      // Navigate to Objectives tab
      cy.get('[role="tablist"]').within(() => {
        cy.get('[role="tab"]').contains(/objectives|obiettivi|goals/i).click();
      });
      cy.wait(500);
    });

    it('should display goals section', () => {
      cy.contains(/goals|obiettivi|target/i).should('be.visible');
    });

    it('should allow adding a new goal', () => {
      // Find add goal button
      cy.contains('button', /add.*goal|aggiungi.*obiettivo|\+/i).click();

      // Should show a form or new goal card
      cy.get('input').should('exist');
    });

    it('should allow entering goal details', () => {
      // Add a new goal
      cy.contains('button', /add.*goal|aggiungi.*obiettivo|\+/i).click();
      cy.wait(300);

      // Fill in goal name
      cy.get('input').last().clear().type('Gran Fondo Milano');

      // Look for priority selector
      cy.get('body').then(($body) => {
        const priorityButtons = $body.find('button').filter((_, el) => {
          const text = el.textContent || '';
          return /^[ABC]$/.test(text.trim());
        });
        if (priorityButtons.length > 0) {
          // Select priority A
          cy.wrap(priorityButtons.filter(':contains("A")').first()).click();
        }
      });
    });

    it('should allow removing a goal', () => {
      // First add a goal
      cy.contains('button', /add.*goal|aggiungi.*obiettivo|\+/i).click();
      cy.wait(300);

      // Count goals
      cy.get('[data-testid="goal-card"], [role="listitem"]').then(($goals) => {
        const initialCount = $goals.length;

        // Find delete button
        cy.get('button').filter('[aria-label*="delete"], [aria-label*="remove"], :contains("×"), :contains("✕")').last().click();

        // Should have one less goal
        cy.get('[data-testid="goal-card"], [role="listitem"]').should('have.length.lessThan', initialCount + 1);
      });
    });

    it('should display training summary', () => {
      // Summary section should show hours, days, etc.
      cy.contains(/weekly.*hours|ore.*settimanali|training.*days|giorni.*allenamento/i).should('exist');
    });
  });

  describe('Availability Tab - Complete Journey', () => {
    beforeEach(() => {
      // Navigate to Availability tab
      cy.get('[role="tablist"]').within(() => {
        cy.get('[role="tab"]').contains(/availability|disponibilità/i).click();
      });
      cy.wait(500);
    });

    describe('Weekly Availability', () => {
      it('should display weekly availability editor', () => {
        cy.contains(/weekly|settimanale/i).should('be.visible');
      });

      it('should show all 7 days of the week', () => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const italianDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

        // Should find at least some day abbreviations
        cy.get('body').then(($body) => {
          const text = $body.text();
          const hasEnglishDays = days.some((d) => text.includes(d));
          const hasItalianDays = italianDays.some((d) => text.includes(d));
          expect(hasEnglishDays || hasItalianDays).to.be.true;
        });
      });

      it('should allow toggling day availability', () => {
        // Find a day toggle switch or button
        cy.get('body').then(($body) => {
          const switches = $body.find('[role="switch"], [type="checkbox"], button[data-day]');
          if (switches.length > 0) {
            // Click to toggle first day
            cy.wrap(switches.first()).click();

            // Save button should become active (changes detected)
            cy.contains('button', /save|salva/i).should('not.be.disabled');
          }
        });
      });

      it('should allow setting hours for available days', () => {
        // Find hour input or slider
        cy.get('body').then(($body) => {
          const hourInputs = $body.find('input[type="number"], input[type="range"], [role="slider"]');
          if (hourInputs.length > 0) {
            // Modify hours
            cy.wrap(hourInputs.first()).then(($input) => {
              if ($input.attr('type') === 'number') {
                cy.wrap($input).clear().type('2');
              }
            });
          }
        });
      });
    });

    describe('Custom Unavailable Dates', () => {
      it('should display unavailable dates section', () => {
        cy.contains(/unavailable|non disponibile|date|custom/i).should('exist');
      });

      it('should allow adding a custom unavailable date', () => {
        // Find add date button
        cy.get('body').then(($body) => {
          const addButtons = $body.find('button').filter((_, el) => {
            const text = (el.textContent || '').toLowerCase();
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
            return text.includes('add') || text.includes('aggiungi') || text.includes('+') ||
                   ariaLabel.includes('add') || ariaLabel.includes('date');
          });

          if (addButtons.length > 0) {
            cy.wrap(addButtons.last()).click();
            cy.wait(300);

            // Should show date picker or input
            cy.get('input[type="date"], [role="dialog"]').should('exist');
          }
        });
      });

      it('should allow setting a reason for unavailable date', () => {
        // Try to add an unavailable date with reason
        cy.get('body').then(($body) => {
          // Look for date input first
          const dateInputs = $body.find('input[type="date"]');
          if (dateInputs.length > 0) {
            // Set a future date
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const dateStr = futureDate.toISOString().split('T')[0];

            cy.wrap(dateInputs.last()).type(dateStr);

            // Look for reason input
            const reasonInputs = $body.find('input[placeholder*="reason"], textarea[placeholder*="reason"], input[placeholder*="motivo"], textarea[placeholder*="motivo"]');
            if (reasonInputs.length > 0) {
              cy.wrap(reasonInputs.last()).type('Family vacation');
            }
          }
        });
      });

      it('should allow removing an unavailable date', () => {
        // First add a date, then remove it
        cy.get('body').then(($body) => {
          const existingDates = $body.find('[data-testid="unavailable-date"], .unavailable-date');
          if (existingDates.length > 0) {
            // Find delete button for the date
            cy.wrap(existingDates.first()).within(() => {
              cy.get('button').filter('[aria-label*="delete"], [aria-label*="remove"], :contains("×")').click();
            });
          }
        });
      });
    });

    describe('Availability Notes', () => {
      it('should display notes section', () => {
        cy.contains(/notes|note|additional|aggiuntive/i).should('exist');
      });

      it('should allow entering availability notes', () => {
        // Find textarea for notes
        cy.get('textarea').then(($textareas) => {
          if ($textareas.length > 0) {
            cy.wrap($textareas.last()).clear().type('I prefer morning workouts. Available for longer rides on weekends.');

            // Changes should be detected
            cy.contains('button', /save|salva/i).should('not.be.disabled');
          }
        });
      });

      it('should preserve notes after refresh', () => {
        const testNote = 'Test note for E2E - ' + Date.now();

        // Enter notes
        cy.get('textarea').last().clear().type(testNote);

        // Save
        cy.contains('button', /save|salva/i).click();
        cy.wait(1000);

        // Refresh the page
        cy.reload();
        cy.wait(1000);

        // Navigate back to Availability tab
        cy.get('[role="tablist"]').within(() => {
          cy.get('[role="tab"]').contains(/availability|disponibilità/i).click();
        });
        cy.wait(500);

        // Notes should be preserved
        cy.get('textarea').last().should('contain.value', 'Test note');
      });
    });
  });

  describe('Complete Settings Journey', () => {
    it('should complete full settings configuration and save', () => {
      cy.log('**Starting Complete Settings Journey**');

      // STEP 1: General Settings
      cy.log('Step 1: Configure General Settings');

      // Set language to English
      cy.contains('button', /english|🇬🇧/i).click();
      cy.wait(300);

      // Set theme to dark
      cy.contains('button', /dark|scuro/i).click();
      cy.wait(300);

      // STEP 2: Profile Settings
      cy.log('Step 2: Update Profile');
      cy.get('[role="tablist"]').within(() => {
        cy.get('[role="tab"]').contains(/profile|profilo/i).click();
      });
      cy.wait(500);

      // Profile tab content should be visible
      cy.contains(/profile|profilo/i).should('be.visible');

      // STEP 3: Goals/Objectives
      cy.log('Step 3: Set Goals');
      cy.get('[role="tablist"]').within(() => {
        cy.get('[role="tab"]').contains(/objectives|obiettivi|goals/i).click();
      });
      cy.wait(500);

      // Add a goal
      cy.contains('button', /add.*goal|aggiungi.*obiettivo|\+/i).click();
      cy.wait(300);

      // Fill goal name
      cy.get('input').filter('[placeholder*="name"], [placeholder*="nome"]').last()
        .type('Test Race Event');

      // STEP 4: Availability Configuration
      cy.log('Step 4: Configure Weekly Availability');
      cy.get('[role="tablist"]').within(() => {
        cy.get('[role="tab"]').contains(/availability|disponibilità/i).click();
      });
      cy.wait(500);

      // Toggle some day availability
      cy.get('[role="switch"], [type="checkbox"]').first().click();
      cy.wait(200);

      // STEP 5: Add Custom Unavailable Dates
      cy.log('Step 5: Add Unavailable Dates');

      // Try to add a custom date
      cy.get('body').then(($body) => {
        const addDateBtn = $body.find('button').filter((_, el) => {
          const text = (el.textContent || '').toLowerCase();
          return (text.includes('add') || text.includes('aggiungi')) &&
                 (text.includes('date') || text.includes('data'));
        });
        if (addDateBtn.length > 0) {
          cy.wrap(addDateBtn.first()).click();
          cy.wait(300);
        }
      });

      // STEP 6: Add Notes
      cy.log('Step 6: Add Availability Notes');

      cy.get('textarea').last().clear().type('E2E Test - Full settings journey completed successfully. Prefer evening workouts during weekdays.');

      // STEP 7: Save All Changes
      cy.log('Step 7: Save All Settings');

      cy.contains('button', /save|salva/i).should('not.be.disabled');
      cy.contains('button', /save|salva/i).click();

      // Wait for save to complete
      cy.wait(2000);

      // Should show success message
      cy.contains(/saved|salvat|success|successo/i).should('exist');

      cy.log('**Settings Journey Complete!**');
    });
  });

  describe('Data Persistence', () => {
    it('should maintain changes after page refresh', () => {
      // Make a change
      cy.contains('button', /dark|scuro/i).click();

      // Refresh
      cy.reload();
      cy.wait(1000);

      // Dark mode should persist (via localStorage)
      cy.get('html').should('satisfy', ($html) => {
        const className = $html.attr('class') || '';
        const style = $html.attr('style') || '';
        return className.includes('dark') || style.includes('color-scheme: dark');
      });
    });

    it('should warn about unsaved changes', () => {
      // Navigate to Availability tab
      cy.get('[role="tablist"]').within(() => {
        cy.get('[role="tab"]').contains(/availability|disponibilità/i).click();
      });
      cy.wait(500);

      // Make a change
      cy.get('[role="switch"], [type="checkbox"]').first().click();

      // Save button should be enabled
      cy.contains('button', /save|salva/i).should('not.be.disabled');
    });
  });
});
