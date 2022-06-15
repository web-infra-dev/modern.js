// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-undef */
/// <reference types="cypress" />
import { getPublicPath } from '../../../utils/testCase';

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress
const dashboardAppName = '@cypress-test/garfish-dashboard';

describe('independent access', () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit(getPublicPath(dashboardAppName));
  });

  it('dashboard app render', () => {
    cy.contains('Dashboard Home page').should('exist');
    cy.get('[data-test=sub-link-dashboard]').click();
    cy.contains('Dashboard detail page').should('exist');
  });
});
