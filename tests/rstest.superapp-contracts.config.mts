import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  root: __dirname,
  testEnvironment: 'node',
  globals: true,
  include: [
    'integration/routes-tanstack/tests/tanstack-data-flow-contract.test.ts',
    'integration/routes-tanstack-create-routes/tests/create-routes-contract.test.ts',
  ],
  testTimeout: 1000 * 60 * 5,
  hookTimeout: 1000 * 60 * 5,
});
