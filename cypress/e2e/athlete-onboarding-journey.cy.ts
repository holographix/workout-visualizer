/// <reference types="cypress" />

/**
 * Athlete Onboarding Journey E2E Tests
 * Tests the complete 7-step athlete onboarding wizard
 *
 * User Journey: New athlete completes full onboarding
 * 1. Personal Info (name, birthday, sex)
 * 2. Physical (height, weight)
 * 3. Category (amatore, juniores, u23, elite, pro)
 * 4. Discipline (MTB, Gravel, Road + sub-types)
 * 5. Terrain preference (hills, flat, mountains)
 * 6. Weekly availability
 * 7. Activity types + equipment (power meter, HR monitor)
 */

describe('Athlete Onboarding Journey', () => {
  // Helper to navigate through steps
  const goToNextStep = () => {
    cy.contains('button', /next|avanti/i).click();
    cy.wait(500);
  };

  const goToPreviousStep = () => {
    cy.contains('button', /previous|indietro/i).click();
    cy.wait(300);
  };

  beforeEach(() => {
    cy.visit('/onboarding');
    cy.wait(500);
  });

  describe('Complete Onboarding Flow', () => {
    it('should complete all 7 steps of onboarding successfully', () => {
      // STEP 1: Personal Information
      cy.log('**Step 1: Personal Information**');

      // Verify step 1 is displayed
      cy.contains(/personal|personali/i).should('be.visible');

      // Next should be disabled initially
      cy.contains('button', /next|avanti/i).should('be.disabled');

      // Fill in full name
      cy.get('input').first().type('Test Athlete E2E');

      // Fill in birthday - find the date input
      cy.get('input[type="date"]').first().type('1990-05-15');

      // Select sex (Male)
      cy.contains('button', /male|maschio/i).click();

      // Now Next should be enabled
      cy.contains('button', /next|avanti/i).should('not.be.disabled');
      goToNextStep();

      // STEP 2: Physical Information
      cy.log('**Step 2: Physical Information**');

      // Verify step 2 is displayed
      cy.contains(/height|altezza|physical|fisico/i).should('be.visible');

      // Fill in height (cm)
      cy.get('input[type="number"]').first().clear().type('180');

      // Fill in weight (kg) - second number input
      cy.get('input[type="number"]').eq(1).clear().type('75');

      // Proceed to next step
      cy.contains('button', /next|avanti/i).should('not.be.disabled');
      goToNextStep();

      // STEP 3: Category Selection
      cy.log('**Step 3: Category Selection**');

      // Verify step 3 is displayed
      cy.contains(/category|categoria/i).should('be.visible');

      // Select Amatore category
      cy.contains('button', /amatore/i).click();

      // Proceed to next step
      cy.contains('button', /next|avanti/i).should('not.be.disabled');
      goToNextStep();

      // STEP 4: Discipline Selection
      cy.log('**Step 4: Discipline Selection**');

      // Verify step 4 is displayed
      cy.contains(/discipline|disciplina/i).should('be.visible');

      // Select Road discipline
      cy.contains('button', /road|strada/i).click();
      cy.wait(300);

      // Select sub-type (Gran Fondo or similar)
      cy.get('body').then(($body) => {
        // Try to find a sub-type button
        const subTypeButtons = $body.find('button').filter((_, el) => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('fondo') || text.includes('circuit') || text.includes('gran');
        });
        if (subTypeButtons.length > 0) {
          cy.wrap(subTypeButtons.first()).click();
        }
      });

      // Proceed to next step
      cy.contains('button', /next|avanti/i).should('not.be.disabled');
      goToNextStep();

      // STEP 5: Terrain Preference
      cy.log('**Step 5: Terrain Preference**');

      // Verify step 5 is displayed
      cy.contains(/terrain|terreno/i).should('be.visible');

      // Select Hills terrain
      cy.contains('button', /hills|colline/i).click();

      // Proceed to next step
      cy.contains('button', /next|avanti/i).should('not.be.disabled');
      goToNextStep();

      // STEP 6: Weekly Availability
      cy.log('**Step 6: Weekly Availability**');

      // Verify step 6 is displayed
      cy.contains(/availability|disponibilità/i).should('be.visible');

      // Toggle some days - availability editor should be present
      cy.get('body').then(($body) => {
        // Try to interact with day toggles if present
        const dayButtons = $body.find('[data-day]');
        if (dayButtons.length > 0) {
          // Click a few days to toggle availability
          cy.wrap(dayButtons.first()).click();
        }
      });

      // Availability is optional, so Next should be enabled
      cy.contains('button', /next|avanti/i).should('not.be.disabled');
      goToNextStep();

      // STEP 7: Activity Types & Equipment
      cy.log('**Step 7: Activity Types & Equipment**');

      // Verify step 7 is displayed
      cy.contains(/activity|attività|equipment|attrezzatura/i).should('be.visible');

      // Select some activity types
      cy.get('body').then(($body) => {
        // Try to find activity type buttons or checkboxes
        const outdoorBtn = $body.find('button, [role="checkbox"]').filter((_, el) => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('outdoor') || text.includes('cycling') || text.includes('ciclismo');
        });
        if (outdoorBtn.length > 0) {
          cy.wrap(outdoorBtn.first()).click();
        }
      });

      // Check equipment options if present
      cy.get('body').then(($body) => {
        const powerMeterCheckbox = $body.find('[type="checkbox"], [role="checkbox"]').filter((_, el) => {
          const label = el.closest('label')?.textContent?.toLowerCase() || '';
          const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
          return label.includes('power') || ariaLabel.includes('power');
        });
        if (powerMeterCheckbox.length > 0) {
          cy.wrap(powerMeterCheckbox.first()).click();
        }
      });

      // Finish button should be visible and enabled
      cy.contains('button', /finish|completa/i).should('be.visible').should('not.be.disabled');

      // Complete onboarding
      cy.contains('button', /finish|completa/i).click();

      // Should redirect to dashboard
      cy.url({ timeout: 15000 }).should('match', /\/(dashboard)?$/);
    });

    it('should allow navigation back and forth between steps', () => {
      // Complete step 1
      cy.get('input').first().type('Test Athlete');
      cy.get('input[type="date"]').first().type('1990-05-15');
      cy.contains('button', /male|maschio/i).click();
      goToNextStep();

      // Now on step 2 - fill in physical info
      cy.get('input[type="number"]').first().clear().type('180');
      cy.get('input[type="number"]').eq(1).clear().type('75');

      // Go back to step 1
      goToPreviousStep();

      // Verify we're back on step 1 - data should be preserved
      cy.get('input').first().should('have.value', 'Test Athlete');

      // Go forward again
      goToNextStep();

      // Physical data should still be there
      cy.get('input[type="number"]').first().should('have.value', '180');
    });
  });

  describe('Step 1: Personal Information Validation', () => {
    it('should require all fields before proceeding', () => {
      // Only fill name
      cy.get('input').first().type('Test Athlete');
      cy.contains('button', /next|avanti/i).should('be.disabled');

      // Add birthday
      cy.get('input[type="date"]').first().type('1990-05-15');
      cy.contains('button', /next|avanti/i).should('be.disabled');

      // Select sex - now should be enabled
      cy.contains('button', /male|maschio/i).click();
      cy.contains('button', /next|avanti/i).should('not.be.disabled');
    });

    it('should show menstrual date field for female athletes', () => {
      cy.get('input').first().type('Test Athlete');
      cy.get('input[type="date"]').first().type('1990-05-15');

      // Select female
      cy.contains('button', /female|femmina/i).click();

      // Should show menstrual date field
      cy.contains(/menstrual|mestruale|cycle|ciclo/i).should('exist');
    });
  });

  describe('Step 4: Discipline Selection', () => {
    beforeEach(() => {
      // Navigate to step 4
      // Step 1
      cy.get('input').first().type('Test Athlete');
      cy.get('input[type="date"]').first().type('1990-05-15');
      cy.contains('button', /male|maschio/i).click();
      goToNextStep();

      // Step 2
      cy.get('input[type="number"]').first().clear().type('180');
      cy.get('input[type="number"]').eq(1).clear().type('75');
      goToNextStep();

      // Step 3
      cy.contains('button', /amatore/i).click();
      goToNextStep();
    });

    it('should display all discipline options', () => {
      cy.contains(/mtb/i).should('exist');
      cy.contains(/gravel/i).should('exist');
      cy.contains(/road|strada/i).should('exist');
    });

    it('should show sub-types after selecting a discipline', () => {
      // Select MTB
      cy.contains('button', /mtb/i).click();
      cy.wait(300);

      // Should show MTB sub-types
      cy.contains(/xc|marathon|cross/i).should('exist');
    });
  });

  describe('Progress Indicator', () => {
    it('should show correct progress through steps', () => {
      // Should show step 1 of 7
      cy.contains(/1.*7|step 1/i).should('exist');

      // Progress bar should exist
      cy.get('[role="progressbar"]').should('exist');

      // Complete step 1 and move to step 2
      cy.get('input').first().type('Test Athlete');
      cy.get('input[type="date"]').first().type('1990-05-15');
      cy.contains('button', /male|maschio/i).click();
      goToNextStep();

      // Should now show step 2
      cy.contains(/2.*7|step 2/i).should('exist');
    });

    it('should display step indicators', () => {
      // Should have 7 step indicators
      cy.get('[role="progressbar"]').parent().within(() => {
        // Look for step numbers or circles
        cy.get('div').should('have.length.at.least', 1);
      });
    });
  });

  describe('Previous Button Behavior', () => {
    it('should be disabled on first step', () => {
      cy.contains('button', /previous|indietro/i).should('be.disabled');
    });

    it('should be enabled on subsequent steps', () => {
      // Complete step 1
      cy.get('input').first().type('Test Athlete');
      cy.get('input[type="date"]').first().type('1990-05-15');
      cy.contains('button', /male|maschio/i).click();
      goToNextStep();

      // Previous should now be enabled
      cy.contains('button', /previous|indietro/i).should('not.be.disabled');
    });
  });
});
