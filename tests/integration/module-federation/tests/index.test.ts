import { setupLab } from './fixture';
import { renderingCases } from './rendering.cases';
import { dataFetchCases } from './data-fetch.cases';
import { comparisonCases } from './comparison.cases';
import { inspectCases } from './inspect.cases';
import { advancedCases } from './advanced.cases';

rstest.setConfig({ testTimeout: 60000, hookTimeout: 600000, retry: 0 });
const modes = process.env.MF_LAB_MODE
  ? [process.env.MF_LAB_MODE as 'dev' | 'production']
  : (['dev', 'production'] as const);
for (const mode of modes) {
  describe(`Federation lab (${mode})`, () => {
    const getContext = setupLab(mode);
    describe('Rendering and assets', () => renderingCases(getContext));
    describe('Data fetching', () => dataFetchCases(getContext));
    describe('Comparison UI', () => comparisonCases(getContext));
    describe('Inspect', () => inspectCases(getContext));
    describe('Advanced scenarios', () => advancedCases(getContext));
  });
}
