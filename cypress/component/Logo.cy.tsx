/// <reference types="cypress" />
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { Logo } from '../../src/components/atoms';

// Wrapper component to provide necessary context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ChakraProvider>
      {children}
    </ChakraProvider>
  </BrowserRouter>
);

describe('Logo Component', () => {
  it('renders with default props', () => {
    cy.mount(
      <TestWrapper>
        <Logo />
      </TestWrapper>
    );

    cy.get('a').should('have.attr', 'href', '/');
  });

  it('renders with text when showText is true', () => {
    cy.mount(
      <TestWrapper>
        <Logo showText />
      </TestWrapper>
    );

    cy.contains('RidePro').should('be.visible');
  });

  it('renders without text when showText is false', () => {
    cy.mount(
      <TestWrapper>
        <Logo showText={false} />
      </TestWrapper>
    );

    cy.contains('RidePro').should('not.exist');
  });

  it('renders in different sizes', () => {
    cy.mount(
      <TestWrapper>
        <Logo size="sm" showText />
      </TestWrapper>
    );

    // Small logo should have smaller dimensions
    cy.get('svg').should('exist');
  });

  it('renders large size', () => {
    cy.mount(
      <TestWrapper>
        <Logo size="lg" showText />
      </TestWrapper>
    );

    cy.contains('RidePro').should('be.visible');
  });
});
