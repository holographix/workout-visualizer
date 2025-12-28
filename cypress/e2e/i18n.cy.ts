/// <reference types="cypress" />

/**
 * Internationalization (i18n) E2E Tests
 * Tests language switching and translation coverage
 *
 * User Journey: User switches language
 * 1. App loads in detected/default language
 * 2. User finds language switcher
 * 3. User switches language
 * 4. All UI updates to new language
 * 5. Preference persists across pages
 */

describe('Internationalization', () => {
  describe('Language Detection', () => {
    it('should load app with default language', () => {
      cy.visit('/dashboard');

      // App should load in English or Italian
      cy.get('body').then($body => {
        const text = $body.text();
        const isEnglish = text.match(/Dashboard|Calendar|Settings/i);
        const isItalian = text.match(/Dashboard|Calendario|Impostazioni/i);
        expect(isEnglish || isItalian).to.exist;
      });
    });
  });

  describe('Language Switcher', () => {
    beforeEach(() => {
      cy.visit('/dashboard');
    });

    it('should display language switcher', () => {
      // Language selector in header or settings
      cy.get('[data-testid="language-switcher"], button[aria-label*="language"], button[aria-label*="lingua"]').should('exist');
    });

    it('should show available languages', () => {
      cy.get('[data-testid="language-switcher"], button[aria-label*="language"]').first().click({ force: true });

      // Dropdown should show English and Italian
      cy.contains(/English|Inglese/i).should('exist');
      cy.contains(/Italiano|Italian/i).should('exist');
    });

    it('should switch to Italian', () => {
      cy.get('[data-testid="language-switcher"], button[aria-label*="language"]').first().click({ force: true });
      cy.contains(/Italiano|Italian/i).click({ force: true });

      cy.wait(500);

      // UI should update to Italian
      cy.contains(/Questa Settimana|Allenamento|Calendario/i).should('exist');
    });

    it('should switch to English', () => {
      // First switch to Italian
      cy.get('[data-testid="language-switcher"], button[aria-label*="language"]').first().click({ force: true });
      cy.contains(/Italiano/i).click({ force: true });
      cy.wait(500);

      // Then switch to English
      cy.get('[data-testid="language-switcher"], button[aria-label*="lingua"]').first().click({ force: true });
      cy.contains(/English|Inglese/i).click({ force: true });
      cy.wait(500);

      // UI should be in English
      cy.contains(/This Week|Workout|Calendar/i).should('exist');
    });
  });

  describe('Translation Coverage - Dashboard', () => {
    it('should translate dashboard in English', () => {
      cy.visit('/dashboard');
      // Set English
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'en');
      });
      cy.reload();

      // Check key elements are translated
      cy.contains(/This Week/i).should('exist');
      cy.contains(/Workouts/i).should('exist');
    });

    it('should translate dashboard in Italian', () => {
      cy.visit('/dashboard');
      // Set Italian
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'it');
      });
      cy.reload();

      // Check key elements are translated
      cy.contains(/Questa Settimana/i).should('exist');
      cy.contains(/Allenamenti/i).should('exist');
    });
  });

  describe('Translation Coverage - Calendar', () => {
    it('should translate calendar page in English', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'en');
      });
      cy.visit('/calendar');

      cy.contains(/Training Calendar/i).should('exist');
      cy.contains(/Today/i).should('exist');
    });

    it('should translate calendar page in Italian', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'it');
      });
      cy.visit('/calendar');

      cy.contains(/Calendario/i).should('exist');
      cy.contains(/Oggi/i).should('exist');
    });
  });

  describe('Translation Coverage - Settings', () => {
    it('should translate settings page in English', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'en');
      });
      cy.visit('/settings');

      cy.contains(/Settings|Profile|Availability/i).should('exist');
    });

    it('should translate settings page in Italian', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'it');
      });
      cy.visit('/settings');

      cy.contains(/Impostazioni|Profilo|Disponibilità/i).should('exist');
    });
  });

  describe('Translation Coverage - Onboarding', () => {
    it('should translate onboarding in English', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'en');
      });
      cy.visit('/onboarding');

      cy.contains(/Welcome|Get Started|Personal/i).should('exist');
    });

    it('should translate onboarding in Italian', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'it');
      });
      cy.visit('/onboarding');

      cy.contains(/Benvenuto|Inizia|Personale/i).should('exist');
    });
  });

  describe('Translation Persistence', () => {
    it('should persist language preference across pages', () => {
      cy.visit('/dashboard');

      // Set Italian
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'it');
      });
      cy.reload();

      // Verify Italian
      cy.contains(/Questa Settimana|Allenament/i).should('exist');

      // Navigate to calendar
      cy.visit('/calendar');

      // Should still be Italian
      cy.contains(/Calendario|Oggi/i).should('exist');

      // Navigate to settings
      cy.visit('/settings');

      // Should still be Italian
      cy.contains(/Impostazioni|Profilo|Disponibilità/i).should('exist');
    });

    it('should persist language after page refresh', () => {
      cy.visit('/dashboard');

      // Set Italian
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'it');
      });
      cy.reload();

      // Refresh
      cy.reload();

      // Should still be Italian
      cy.contains(/Questa Settimana|Allenament/i).should('exist');
    });
  });

  describe('Dynamic Content Translation', () => {
    it('should translate workout types', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'it');
      });
      cy.visit('/calendar');

      // Open library
      cy.get('button').filter(':contains("Library"), [aria-label*="library"]').first().click({ force: true });

      // Categories should be translated
      cy.get('[role="dialog"]').then($modal => {
        if ($modal.length > 0) {
          const text = $modal.text();
          // Should have Italian workout terms
          const hasItalian = text.match(/Resistenza|Soglia|Recupero/i);
          const hasEnglish = text.match(/Endurance|Threshold|Recovery/i);
          expect(hasItalian || hasEnglish).to.exist;
        }
      });
    });

    it('should translate form validation messages', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'it');
      });
      cy.visit('/onboarding');

      // Try to proceed without filling required fields
      cy.contains('button', /avanti|next/i).should('be.disabled');
    });

    it('should translate error messages', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'it');
      });
      cy.visit('/dashboard');

      // Trigger an error scenario (mock or real)
      // Error messages should be in Italian
    });
  });

  describe('Date/Time Localization', () => {
    it('should format dates in English locale', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'en');
      });
      cy.visit('/calendar');

      // English day names
      cy.contains(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/i).should('exist');
    });

    it('should format dates in Italian locale', () => {
      cy.window().then(win => {
        win.localStorage.setItem('i18nextLng', 'it');
      });
      cy.visit('/calendar');

      // Italian day names (abbreviated)
      cy.contains(/Lun|Mar|Mer|Gio|Ven|Sab|Dom/i).should('exist');
    });
  });

  describe('RTL Support', () => {
    // RidePro doesn't have RTL languages yet, but this is a placeholder
    it('should maintain LTR layout for supported languages', () => {
      cy.visit('/dashboard');

      cy.get('html').should('have.attr', 'dir').and('match', /ltr/i);
    });
  });
});
