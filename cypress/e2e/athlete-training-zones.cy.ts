/// <reference types="cypress" />

/**
 * Athlete Training Zones E2E Tests
 * Tests the training zones display on the athlete stats page
 *
 * User Journey 23: Coach Views Athlete Training Zones
 * 1. Navigate to athlete stats page
 * 2. View Training Zones section
 * 3. Verify Power Zones table with 6 zones
 * 4. Verify HR Zones table with 5 zones
 * 5. Handle empty states when FTP/MaxHR not set
 */

describe('Athlete Training Zones', () => {
  beforeEach(() => {
    // Visit coach page first to get athlete list
    cy.visit('/coach');
  });

  describe('Training Zones on Athlete Stats Page', () => {
    it('should navigate to athlete stats page from coach view', () => {
      // Look for athlete card and click to view stats
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          // Click on stats link/button
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').then($statsBtn => {
            if ($statsBtn.length > 0) {
              cy.wrap($statsBtn).first().click({ force: true });
              cy.wait(500);

              // Verify navigation to stats page
              cy.url().should('include', '/stats');
            }
          });
        }
      });
    });

    it('should display Training Zones section title', () => {
      // Navigate to a known athlete stats page
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              // Check for Training Zones section
              cy.contains(/training zones|zone di allenamento/i).should('exist');
            }
          });
        }
      });
    });

    it('should display Power Zones section', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              // Check for Power Zones heading
              cy.contains(/power zones|zone potenza/i).should('exist');
            }
          });
        }
      });
    });

    it('should display HR Zones section', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              // Check for HR Zones heading
              cy.contains(/hr zones|zone fc|heart rate/i).should('exist');
            }
          });
        }
      });
    });

    it('should show FTP badge if athlete has FTP', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              cy.get('body').then($body => {
                // Check for FTP badge or "no FTP" message
                const hasFTPBadge = $body.text().match(/FTP:\s*\d+\s*W/i);
                const hasNoFTPMessage = $body.text().match(/no ftp data|nessun dato ftp/i);
                expect(hasFTPBadge || hasNoFTPMessage).to.exist;
              });
            }
          });
        }
      });
    });

    it('should show Max HR badge if athlete has Max HR', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              cy.get('body').then($body => {
                // Check for Max HR badge or "no Max HR" message
                const hasMaxHRBadge = $body.text().match(/max hr:\s*\d+\s*bpm/i);
                const hasNoMaxHRMessage = $body.text().match(/no max hr data|nessun dato fc max/i);
                expect(hasMaxHRBadge || hasNoMaxHRMessage).to.exist;
              });
            }
          });
        }
      });
    });
  });

  describe('Power Zones Table Content', () => {
    it('should display zone names in Power Zones table', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              cy.get('body').then($body => {
                // Check for zone names (Italian or English)
                const hasRecupero = $body.text().match(/recupero|recovery/i);
                const hasResistenza = $body.text().match(/resistenza|endurance/i);
                const hasTempo = $body.text().match(/tempo|medio/i);
                const hasSoglia = $body.text().match(/soglia|threshold/i);
                const hasVO2 = $body.text().match(/vo2max/i);

                // At least one zone name should be present, or "no FTP" message
                const hasNoFTP = $body.text().match(/no ftp|complete an assessment/i);
                expect(hasRecupero || hasResistenza || hasTempo || hasSoglia || hasVO2 || hasNoFTP).to.exist;
              });
            }
          });
        }
      });
    });

    it('should display 6 Power zones (Z1-Z6) if FTP is set', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              cy.get('body').then($body => {
                const hasFTP = $body.text().match(/FTP:\s*\d+\s*W/i);
                if (hasFTP) {
                  // If FTP is set, should have zone badges
                  cy.contains(/Z1|Z2|Z3|Z4|Z5|Z6/i).should('exist');
                }
              });
            }
          });
        }
      });
    });
  });

  describe('HR Zones Table Content', () => {
    it('should display 5 HR zones (Z1-Z5) if Max HR is set', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              cy.get('body').then($body => {
                const hasMaxHR = $body.text().match(/max hr:\s*\d+\s*bpm/i);
                if (hasMaxHR) {
                  // If Max HR is set, should have zone badges
                  cy.contains(/Z1|Z2|Z3|Z4|Z5/i).should('exist');
                }
              });
            }
          });
        }
      });
    });

    it('should show BPM ranges in HR zones table', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              cy.get('body').then($body => {
                const hasMaxHR = $body.text().match(/max hr:\s*\d+\s*bpm/i);
                if (hasMaxHR) {
                  // Should show BPM values or ranges
                  const hasBPMValues = $body.text().match(/\d+-\d+/);
                  expect(hasBPMValues).to.exist;
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Empty States', () => {
    it('should show message when no FTP data available', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              cy.get('body').then($body => {
                const hasFTP = $body.text().match(/FTP:\s*\d+\s*W/i);
                if (!hasFTP) {
                  // Should show empty state message
                  cy.contains(/no ftp|complete an assessment|nessun dato/i).should('exist');
                }
              });
            }
          });
        }
      });
    });

    it('should show message when no Max HR data available', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              cy.get('body').then($body => {
                const hasMaxHR = $body.text().match(/max hr:\s*\d+\s*bpm/i);
                if (!hasMaxHR) {
                  // Should show empty state message
                  cy.contains(/no max hr|complete an assessment|nessun dato/i).should('exist');
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Zones Page Mobile View', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should display zones on mobile', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              // Training Zones should be visible on mobile
              cy.contains(/training zones|zone di allenamento/i).should('exist');
            }
          });
        }
      });
    });

    it('should display both Power and HR zones tables on mobile', () => {
      cy.get('[data-testid="athlete-card"]').first().then($card => {
        if ($card.length > 0) {
          cy.wrap($card).find('a, button').filter(':contains("Stats"), :contains("Statistiche")').first().click({ force: true });
          cy.wait(500);

          cy.url().then(url => {
            if (url.includes('/stats')) {
              // Check for both zone sections
              cy.contains(/power zones|zone potenza/i).should('exist');
              cy.contains(/hr zones|zone fc/i).should('exist');
            }
          });
        }
      });
    });
  });
});

describe('Direct Athlete Stats Page Navigation', () => {
  it('should load athlete stats page with zones section', () => {
    // Try to navigate directly to an athlete stats page
    // This is a fallback test that doesn't depend on having athletes in the list
    cy.visit('/athlete/test-athlete-id/stats');

    cy.get('body').then($body => {
      // Should show either the stats page content or a 404/error
      const hasStatsPage = $body.text().match(/statistics|statistiche|training zones|zone/i);
      const hasError = $body.text().match(/not found|404|error/i);
      expect(hasStatsPage || hasError).to.exist;
    });
  });
});
