import { CliPlugin, manager } from '../src';

describe('pluginAPI', () => {
  it('api.setAppContext', done => {
    const plugin = (): CliPlugin => ({
      setup(api) {
        api.setAppContext({
          ...api.useAppContext(),
          packageName: 'foo',
        });

        expect(api.useAppContext().packageName).toEqual('foo');
        done();
      },
    });

    manager.clone().usePlugin(plugin).init();
  });
});
