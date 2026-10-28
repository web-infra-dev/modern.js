import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { markRootExposes } from './rootExposes';

it('marks only Modern root candidates and leaves the caller config and ordinary exposes intact', () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'modern-root-exposes-'),
  );
  try {
    fs.writeFileSync(
      path.join(directory, 'app.tsx'),
      "import { createRoot } from '@modern-js/runtime/react'",
    );
    fs.writeFileSync(
      path.join(directory, 'card.tsx'),
      'export default () => null',
    );
    const input = {
      './App': './app.tsx',
      './Card': './card.tsx',
      './Named': { import: './app.tsx', name: 'named' },
    };
    const result = markRootExposes(input, directory);
    expect(result).toEqual({
      './App': './app.tsx?modern-mf-root',
      './Card': './card.tsx',
      './Named': { import: './app.tsx?modern-mf-root', name: 'named' },
    });
    expect(input['./App']).toBe('./app.tsx');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
