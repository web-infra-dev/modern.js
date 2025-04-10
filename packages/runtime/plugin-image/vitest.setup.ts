// NOTICE: Do NOT import '@testing-library/jest-dom/vitest' directly,
// It will import another vitest instance, and cause the issue: https://github.com/vitest-dev/vitest/issues/7668
import * as matchers from '@testing-library/jest-dom/matchers';
import type {} from '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';

expect.extend(matchers);
