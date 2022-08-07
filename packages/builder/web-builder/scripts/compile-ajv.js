const { ConfigValidator } = require('../dist/config/validate');
const path = require('path');

async function compile() {
  const validator = await ConfigValidator.create();
  const output = path.resolve(
    __dirname,
    '../compiled/config-validator/index.js',
  );
  await ConfigValidator.serialize(validator, output);
}

compile();
