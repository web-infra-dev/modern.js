import { BrowserRouter as Router } from '@modern-js/runtime/router';
import { page } from '@rstest/browser';
import { render } from '@rstest/browser-react';
import { expect, test } from '@rstest/core';
import App from '../src/App';

test('renders the main page', async () => {
  const testMessage = 'Powered by Modern.js';
  await render(
    <Router>
      <App />
    </Router>,
  );

  await expect
    .element(page.getByRole('link', { name: testMessage }))
    .toBeVisible();
});
