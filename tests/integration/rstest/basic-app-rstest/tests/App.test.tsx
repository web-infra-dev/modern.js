import { BrowserRouter as Router } from '@modern-js/runtime/router';
import { expect, test } from '@rstest/core';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

test('renders the main page', () => {
  const testMessage = 'Powered by Modern.js';
  render(
    <Router>
      <App />
    </Router>,
  );
  expect(screen.getByText(testMessage)).toBeInTheDocument();
});
