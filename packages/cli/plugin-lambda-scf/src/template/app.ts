export type EntryOptions = {
  config: Record<string, any>;
  pwd?: string;
  plugins?: string[];
};

export default (options: EntryOptions) => `
  const modernServer = require('@modern-js/server')

  modernServer.default({
    pwd: __dirname,
    config: ${JSON.stringify(options.config)},
  }).then((app) => {
    app.listen(9000, () => {
      console.log('listen modern server on 9000')
    })
  })
  `;
