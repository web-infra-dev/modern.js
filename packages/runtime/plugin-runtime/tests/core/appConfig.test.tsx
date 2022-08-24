import { defineConfig, getConfig } from '../../src/runtime';

describe('defineConfig & getConfig', () => {
  it('default', async () => {
    function App() {
      return <div>App</div>;
    }

    const config = {
      state: true,
    };
    const beforeConfig = getConfig(App);

    defineConfig(App, config);

    const afterConfig = getConfig(App);

    expect(beforeConfig).toBe(undefined);
    expect(afterConfig).toBe(config);
  });
});
