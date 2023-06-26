/* eslint-disable no-undef */
/// <reference types="cypress" />
import { getPublicPath } from '../../../utils/testCase';

const mainAppName = '@cypress-test/garfish-main-router-v6';

describe('render sub app', () => {
  beforeEach(() => {
    cy.visit(getPublicPath(mainAppName));
  });

  it('render sub application', () => {
    cy.wait(1000);
    cy.get('#renderMicroApp').click();
    // because of refactor Loadable component to react hooks
    // this intermediate state no longer appear
    // cy.contains('dashboard loading').should('exist');
    cy.wait(100);
    cy.contains('Main loader').should('exist');
    cy.contains('Dashboard App').should('exist');
    cy.contains('Props from main app: hello world from main app').should(
      'exist',
    );
    cy.get('#renderRoute').click();
    cy.contains('Dashboard loader').should('exist');
    cy.contains('Dashboard detail page').should('exist');
    cy.contains('params: profile').should('exist');
  });
});
