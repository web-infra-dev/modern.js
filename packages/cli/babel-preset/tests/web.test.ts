import { expect, test } from '@rstest/core';
import { getBabelConfigForWeb } from '../src/web';

test('should provide web preset as expected', () => {
  expect(
    getBabelConfigForWeb({
      presetEnv: {
        targets: ['Chrome >= 53'],
        useBuiltIns: false,
      },
    }),
  ).toMatchSnapshot();
});

test('should provide web preset as expected when presetEnv is false', () => {
  expect(
    getBabelConfigForWeb({
      presetEnv: false,
    }).presets,
  ).toMatchSnapshot();
});

test('should provide web preset as expected when presetEnv is empty object', () => {
  expect(
    getBabelConfigForWeb({
      presetEnv: {},
    }).presets,
  ).toMatchSnapshot();
});

test('should support inject core-js polyfills by entry', () => {
  expect(
    getBabelConfigForWeb({
      presetEnv: {
        targets: ['Chrome >= 53'],
        useBuiltIns: 'entry',
      },
    }),
  ).toMatchSnapshot();
});

test('should support inject core-js polyfills by usage', () => {
  expect(
    getBabelConfigForWeb({
      presetEnv: {
        targets: ['Chrome >= 53'],
        useBuiltIns: 'usage',
      },
    }),
  ).toMatchSnapshot();
});

test('should allow to enable legacy decorator', () => {
  expect(
    getBabelConfigForWeb({
      presetEnv: {
        targets: ['Chrome >= 53'],
        useBuiltIns: false,
      },
      pluginDecorators: {
        version: 'legacy',
      },
    }),
  ).toMatchSnapshot();
});

test('should allow to enable specific version decorator', () => {
  expect(
    getBabelConfigForWeb({
      presetEnv: {
        targets: ['Chrome >= 53'],
        useBuiltIns: false,
      },
      pluginDecorators: {
        version: '2018-09',
      },
    }),
  ).toMatchSnapshot();
});
