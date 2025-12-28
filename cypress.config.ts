import { defineConfig } from 'cypress';

export default defineConfig({
  // Cypress Cloud projectId - optional, only needed if you want to use Cypress Cloud
  // projectId: '2ms3cs',

  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    // Disable web security for Clerk cross-origin auth
    chromeWebSecurity: false,
    // Mochawesome reporter configuration
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      html: true,
      json: true,
      timestamp: 'mmddyyyy_HHMMss',
    },
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
  },

  // Retry configuration
  retries: {
    runMode: 2,
    openMode: 0,
  },

  // Environment variables
  env: {
    apiUrl: 'http://localhost:3001/api',
    // Clerk authentication domain
    clerkDomain: 'https://musical-iguana-70.clerk.accounts.dev',
    // Test user credentials
    testUserEmail: 'aacsyed@gmail.com',
    testUserPassword: 'RidePro25!',
  },
});
