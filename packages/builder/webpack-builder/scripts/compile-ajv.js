const { ConfigValidator } = require('../dist/config/validate');
const path = require('path');

async function compile() {
  const output = path.resolve(
    __dirname,
    '../compiled/config-validator/index.js',
  );
  const validator = await ConfigValidator.create();
  await ConfigValidator.serialize(validator, output);
}

compile();
