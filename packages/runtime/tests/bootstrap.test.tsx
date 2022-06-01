import React from 'react';
import { bootstrap } from '../src/compatible';

jest.mock('react-dom', () => ({
  render: jest.fn(),
}));

describe('bootstrap', () => {
  it('Only return App Comoonent by `createApp`', async () => {
    function App() {
      return <div>App</div>;
    }

    const result = await bootstrap(App);
    expect(React.isValidElement(result as any)).toBe(true);
  });
});
