import path from 'path';
import { isApiOnly } from '../src/analyzeProject';

describe('analyzeProject', () => {
  test('apiOnly should be calculate correctly', () => {
    const projectDir = path.join('./fixtures', 'analyze-projects', 'api-only');
    const apiOnly = isApiOnly(projectDir);
    expect(apiOnly).toBeTruthy();
  });
});
