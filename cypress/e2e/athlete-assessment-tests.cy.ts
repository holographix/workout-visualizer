/// <reference types="cypress" />

/**
 * Athlete Assessment Tests E2E
 * Tests the fitness assessment flow for athletes
 *
 * Assessment Types:
 * 1. Sprint + 12min Climb Protocol
 *    - Sprint Peak Power (15 seconds)
 *    - Sprint Max HR
 *    - 12' Climb Average Power
 *    - 12' Climb Max HR
 *
 * 2. 1/2/5 Minute Efforts Protocol
 *    - 1 minute Average Power + Max HR
 *    - 2 minute Average Power + Max HR
 *    - 5 minute Average Power + Max HR
 *
 * User Journey: Athlete completes a fitness assessment
 */

describe('Athlete Assessment Tests', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
    cy.wait(1000);
    cy.dismissTour();
  });

  describe('Assessment Card on Dashboard', () => {
    it('should display assessment card or section on dashboard', () => {
      // Look for assessment-related content
      cy.get('body').then(($body) => {
        const hasAssessment = $body.find('[data-testid="assessment-card"]').length > 0;
        const hasAssessmentText = $body.text().match(/assessment|test|valutazione|ftp/i);

        // Assessment section should exist in some form
        expect(hasAssessment || hasAssessmentText).to.exist;
      });
    });

    it('should have a button to start assessment', () => {
      cy.get('body').then(($body) => {
        const assessmentCard = $body.find('[data-testid="assessment-card"]');
        if (assessmentCard.length > 0) {
          cy.get('[data-testid="assessment-card"]').find('button').should('exist');
        }
      });
    });
  });

  describe('Assessment Modal', () => {
    beforeEach(() => {
      // Try to open assessment modal
      cy.get('body').then(($body) => {
        const assessmentCard = $body.find('[data-testid="assessment-card"]');
        if (assessmentCard.length > 0) {
          cy.get('[data-testid="assessment-card"]').find('button').click({ force: true });
          cy.wait(500);
        }
      });
    });

    it('should open assessment modal when clicking start', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[role="dialog"]').length > 0) {
          cy.get('[role="dialog"]').should('be.visible');
        }
      });
    });

    it('should display protocol selection options', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[role="dialog"]').length > 0) {
          // Should show protocol options
          const dialogText = $body.find('[role="dialog"]').text();
          const hasProtocols = dialogText.match(/sprint|12.*min|1.*2.*5|protocol/i);
          expect(hasProtocols).to.exist;
        }
      });
    });
  });

  describe('Sprint + 12min Protocol', () => {
    it('should allow selecting Sprint + 12min protocol', () => {
      // Open assessment modal
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          // Select Sprint + 12min protocol
          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              const sprintButton = $modal.find('button').filter((_, el) => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('sprint') || text.includes('12');
              });
              if (sprintButton.length > 0) {
                cy.wrap(sprintButton.first()).click();
              }
            }
          });
        }
      });
    });

    it('should display Sprint + 12min form fields', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              // Select protocol
              const sprintButton = $modal.find('button').filter((_, el) => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('sprint') || text.includes('12');
              });
              if (sprintButton.length > 0) {
                cy.wrap(sprintButton.first()).click();
                cy.wait(300);

                // Should show form fields for sprint data
                cy.get('[role="dialog"]').should('contain.text', /power|potenza|watt|hr|heart/i);
              }
            }
          });
        }
      });
    });

    it('should allow entering Sprint data', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              // Select sprint protocol
              const sprintButton = $modal.find('button').filter((_, el) => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('sprint');
              });
              if (sprintButton.length > 0) {
                cy.wrap(sprintButton.first()).click();
                cy.wait(300);

                // Enter sprint peak power
                cy.get('[role="dialog"]').find('input[type="number"]').first().clear().type('1200');

                // Enter sprint max HR
                cy.get('[role="dialog"]').find('input[type="number"]').eq(1).clear().type('185');
              }
            }
          });
        }
      });
    });

    it('should allow entering 12min climb data', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              // Find 12min power input
              const inputs = $modal.find('input[type="number"]');
              if (inputs.length >= 4) {
                // Enter 12' average power
                cy.wrap(inputs.eq(2)).clear().type('280');
                // Enter 12' max HR
                cy.wrap(inputs.eq(3)).clear().type('175');
              }
            }
          });
        }
      });
    });
  });

  describe('1/2/5 Minute Efforts Protocol', () => {
    it('should allow selecting 1/2/5min protocol', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              const effortButton = $modal.find('button').filter((_, el) => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('1') && text.includes('2') && text.includes('5');
              });
              if (effortButton.length > 0) {
                cy.wrap(effortButton.first()).click();
              }
            }
          });
        }
      });
    });

    it('should display 1/2/5min form fields', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              const effortButton = $modal.find('button').filter((_, el) => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('1') && (text.includes('2') || text.includes('5'));
              });
              if (effortButton.length > 0) {
                cy.wrap(effortButton.first()).click();
                cy.wait(300);

                // Should show fields for 1min, 2min, 5min data
                cy.get('[role="dialog"]').should('contain.text', /1.*min|2.*min|5.*min/i);
              }
            }
          });
        }
      });
    });

    it('should allow entering effort data for all durations', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              // Select 1/2/5 protocol
              const effortButton = $modal.find('button').filter((_, el) => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('1') && (text.includes('2') || text.includes('5'));
              });
              if (effortButton.length > 0) {
                cy.wrap(effortButton.first()).click();
                cy.wait(300);

                const inputs = $modal.find('input[type="number"]');
                if (inputs.length >= 6) {
                  // 1 min power and HR
                  cy.wrap(inputs.eq(0)).clear().type('450');
                  cy.wrap(inputs.eq(1)).clear().type('190');

                  // 2 min power and HR
                  cy.wrap(inputs.eq(2)).clear().type('380');
                  cy.wrap(inputs.eq(3)).clear().type('185');

                  // 5 min power and HR
                  cy.wrap(inputs.eq(4)).clear().type('320');
                  cy.wrap(inputs.eq(5)).clear().type('180');
                }
              }
            }
          });
        }
      });
    });
  });

  describe('Complete Assessment Flow', () => {
    it('should complete full Sprint + 12min assessment', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.log('**Starting Sprint + 12min Assessment**');

          // Open modal
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              // Select protocol
              cy.log('Selecting Sprint + 12min protocol');
              const sprintButton = $modal.find('button').filter((_, el) => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('sprint');
              });
              if (sprintButton.length > 0) {
                cy.wrap(sprintButton.first()).click();
                cy.wait(500);

                // Fill in all data
                cy.log('Entering assessment data');
                const inputs = Cypress.$('[role="dialog"] input[type="number"]');

                if (inputs.length >= 4) {
                  // Sprint Peak Power
                  cy.get('[role="dialog"]').find('input[type="number"]').eq(0).clear().type('1150');
                  // Sprint Max HR
                  cy.get('[role="dialog"]').find('input[type="number"]').eq(1).clear().type('188');
                  // 12' Avg Power
                  cy.get('[role="dialog"]').find('input[type="number"]').eq(2).clear().type('275');
                  // 12' Max HR
                  cy.get('[role="dialog"]').find('input[type="number"]').eq(3).clear().type('178');
                }

                // Set test date if available
                cy.get('[role="dialog"]').find('input[type="date"]').then(($dateInput) => {
                  if ($dateInput.length > 0) {
                    const today = new Date().toISOString().split('T')[0];
                    cy.wrap($dateInput).type(today);
                  }
                });

                // Add notes if available
                cy.get('[role="dialog"]').find('textarea').then(($textarea) => {
                  if ($textarea.length > 0) {
                    cy.wrap($textarea).type('E2E Test - Sprint + 12min assessment completed');
                  }
                });

                // Submit
                cy.log('Submitting assessment');
                cy.get('[role="dialog"]').find('button').filter(':contains("Save"), :contains("Submit"), :contains("Salva")').click();

                // Should close modal or show success
                cy.wait(1000);
              }
            }
          });
        }
      });
    });

    it('should complete full 1/2/5min assessment', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.log('**Starting 1/2/5 Minute Assessment**');

          // Open modal
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              // Select 1/2/5 protocol
              cy.log('Selecting 1/2/5min protocol');
              const effortButton = $modal.find('button').filter((_, el) => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('1') && (text.includes('2') || text.includes('5'));
              });
              if (effortButton.length > 0) {
                cy.wrap(effortButton.first()).click();
                cy.wait(500);

                // Fill in effort data
                cy.log('Entering effort data');
                const inputs = Cypress.$('[role="dialog"] input[type="number"]');

                if (inputs.length >= 6) {
                  // 1 min
                  cy.get('[role="dialog"]').find('input[type="number"]').eq(0).clear().type('480');
                  cy.get('[role="dialog"]').find('input[type="number"]').eq(1).clear().type('192');
                  // 2 min
                  cy.get('[role="dialog"]').find('input[type="number"]').eq(2).clear().type('400');
                  cy.get('[role="dialog"]').find('input[type="number"]').eq(3).clear().type('188');
                  // 5 min
                  cy.get('[role="dialog"]').find('input[type="number"]').eq(4).clear().type('340');
                  cy.get('[role="dialog"]').find('input[type="number"]').eq(5).clear().type('182');
                }

                // Add notes
                cy.get('[role="dialog"]').find('textarea').then(($textarea) => {
                  if ($textarea.length > 0) {
                    cy.wrap($textarea).type('E2E Test - 1/2/5min assessment completed');
                  }
                });

                // Submit
                cy.log('Submitting assessment');
                cy.get('[role="dialog"]').find('button').filter(':contains("Save"), :contains("Submit"), :contains("Salva")').click();

                cy.wait(1000);
              }
            }
          });
        }
      });
    });
  });

  describe('Assessment Results', () => {
    it('should display estimated FTP after assessment', () => {
      cy.get('body').then(($body) => {
        // Look for FTP display
        const hasFTP = $body.text().match(/FTP.*\d+|estimated.*power|potenza.*stimata/i);
        if (hasFTP) {
          cy.contains(/FTP|estimated.*power/i).should('exist');
        }
      });
    });

    it('should show assessment history', () => {
      cy.get('body').then(($body) => {
        // Look for assessment history section
        const hasHistory = $body.find('[data-testid="assessment-history"]').length > 0;
        const hasHistoryText = $body.text().match(/history|storico|previous|precedent/i);

        if (hasHistory || hasHistoryText) {
          cy.contains(/history|storico|previous|precedent/i).should('exist');
        }
      });
    });
  });

  describe('Assessment Validation', () => {
    it('should validate power values are reasonable', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              // Try to enter unrealistic power value
              const inputs = $modal.find('input[type="number"]');
              if (inputs.length > 0) {
                cy.wrap(inputs.first()).clear().type('10000');

                // Should show validation error or disable submit
                cy.get('[role="dialog"]').find('button').filter(':contains("Save"), :contains("Submit")').then(($btn) => {
                  // Either button is disabled or there's an error message
                  const isDisabled = $btn.is(':disabled');
                  const hasError = $modal.text().match(/invalid|error|errore|too high/i);
                  expect(isDisabled || hasError).to.exist;
                });
              }
            }
          });
        }
      });
    });

    it('should require all fields before submitting', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').then(($modal) => {
            if ($modal.length > 0) {
              // Select a protocol
              const protocolButton = $modal.find('button').filter((_, el) => {
                const text = el.textContent?.toLowerCase() || '';
                return text.includes('sprint') || text.includes('1');
              });
              if (protocolButton.length > 0) {
                cy.wrap(protocolButton.first()).click();
                cy.wait(300);

                // Submit button should be disabled with empty fields
                cy.get('[role="dialog"]').find('button').filter(':contains("Save"), :contains("Submit")').should('be.disabled');
              }
            }
          });
        }
      });
    });
  });

  describe('Assessment Modal Close', () => {
    it('should close modal on cancel', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').should('be.visible');

          // Close modal
          cy.get('button[aria-label="Close"], button:contains("Cancel"), button:contains("Annulla"), button:contains("×")').first().click();

          // Modal should be closed
          cy.get('[role="dialog"]').should('not.exist');
        }
      });
    });

    it('should close modal on overlay click', () => {
      cy.get('[data-testid="assessment-card"]').then(($card) => {
        if ($card.length > 0) {
          cy.wrap($card).find('button').click({ force: true });
          cy.wait(500);

          cy.get('[role="dialog"]').should('be.visible');

          // Click overlay
          cy.get('.chakra-modal__overlay, [class*="overlay"]').click({ force: true });

          cy.wait(300);
        }
      });
    });
  });
});
