import { expect, test } from '@rstest/core';
import { getBabelConfigForNode } from '../src/node';

test('should provide node preset as expected', () => {
  expect(getBabelConfigForNode()).toMatchSnapshot();
});

test('should allow to override target node version', () => {
  expect(
    getBabelConfigForNode({
      presetEnv: {
        targets: ['node >= 20'],
      },
    }),
  ).toMatchSnapshot();
});

test('should provide node preset as expected when presetEnv is false', () => {
  expect(
    getBabelConfigForNode({
      presetEnv: false,
    }).presets,
  ).toMatchSnapshot();
});

test('should allow to enable legacy decorator', () => {
  expect(
    getBabelConfigForNode({
      presetEnv: {
        targets: ['node >= 20'],
      },
      pluginDecorators: {
        version: 'legacy',
      },
    }),
  ).toMatchSnapshot();
});
