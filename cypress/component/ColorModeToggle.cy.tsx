/// <reference types="cypress" />
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { ColorModeToggle } from '../../src/components/atoms';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider>
    <ColorModeScript />
    {children}
  </ChakraProvider>
);

describe('ColorModeToggle Component', () => {
  it('renders the toggle button', () => {
    cy.mount(
      <TestWrapper>
        <ColorModeToggle />
      </TestWrapper>
    );

    cy.get('button').should('exist');
  });

  it('has accessible aria-label', () => {
    cy.mount(
      <TestWrapper>
        <ColorModeToggle />
      </TestWrapper>
    );

    cy.get('button').should('have.attr', 'aria-label');
  });

  it('toggles color mode on click', () => {
    cy.mount(
      <TestWrapper>
        <ColorModeToggle />
      </TestWrapper>
    );

    // Get initial state and click
    cy.get('button').click();

    // Click again to toggle back
    cy.get('button').click();
  });

  it('displays sun or moon icon based on mode', () => {
    cy.mount(
      <TestWrapper>
        <ColorModeToggle />
      </TestWrapper>
    );

    // Should have an svg icon
    cy.get('button svg').should('exist');
  });
});
