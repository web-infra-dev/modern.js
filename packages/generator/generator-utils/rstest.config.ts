import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  root: __dirname,
  globals: true,
});
