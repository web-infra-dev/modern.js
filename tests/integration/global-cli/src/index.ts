export default {
  name: 'global-cli',
  setup() {
    return {
      commands({ program }: any) {
        program.name('modern');
        program.command('init').action(() => {
          console.info('run init command in global-cli');
        });
      },
    };
  },
};
