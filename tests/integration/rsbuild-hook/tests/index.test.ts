import path from 'path';
import { modernBuild } from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

function processStdout(stdout: string) {
  const cleaned = stdout.replace(
    // biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
    /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g,
    '',
  );
  return cleaned.replace(/\r\n/g, '\n').trim();
}

function verifyOrder(output: string, expectedOrder: string[]): boolean {
  let currentIndex = 0;
  const lines = output.split('\n');

  for (const line of lines) {
    if (line.includes(expectedOrder[currentIndex])) {
      currentIndex++;
    }
    if (currentIndex === expectedOrder.length) {
      return true;
    }
  }

  return false;
}
describe('build with rspack', () => {
  test('rspack hooks', async () => {
    const buildResult = await modernBuild(appDir, [], {
      env: {
        BUNDLER: 'rspack',
      },
    });

    expect(buildResult.code).toEqual(0);

    const cleanOutput = processStdout(buildResult.stdout);
    const expectedOrder = [
      'modifyBundlerChain',
      'tools.bundlerChain',
      'modifyRspackConfig',
      'tools.rspack',
    ];

    expect(verifyOrder(cleanOutput, expectedOrder)).toBeTruthy();
  });
});

describe('build with webpack', () => {
  test('webpack hooks', async () => {
    const buildResult = await modernBuild(appDir, [], {
      env: {
        BUNDLER: 'webpack',
      },
    });

    expect(buildResult.code).toEqual(0);

    const cleanOutput = processStdout(buildResult.stdout);
    const expectedOrder = [
      'modifyBundlerChain',
      'tools.bundlerChain',
      'modifyWebpackChain',
      'tools.webpackChain',
      'modifyWebpackConfig',
      'tools.webpack',
    ];

    expect(verifyOrder(cleanOutput, expectedOrder)).toBeTruthy();
  });
});
