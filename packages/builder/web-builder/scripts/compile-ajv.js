const { ConfigValidator } = require('../dist/config/validate');
const path = require('path');
const fs = require('fs');

async function compile() {
  const output = path.resolve(
    __dirname,
    '../compiled/config-validator/index.js',
  );
  fs.rmSync(output);
  const validator = await ConfigValidator.create();
  await ConfigValidator.serialize(validator, output);
}

compile();
