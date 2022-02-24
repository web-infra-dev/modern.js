import React from 'react';
import { bootstrap } from '../src/compatible';

jest.mock('react-dom', () => ({
  render: jest.fn(),
}));

describe('bootstrap', () => {
  it('Component not created by `createApp`', async () => {
    function App() {
      return <div>App</div>;
    }

    await expect(bootstrap(App)).resolves.not.toBeDefined();
  });
});
