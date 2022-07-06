import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import { patchSchema } from '@modern-js/core';
import { addSchema } from '../src/schema';
import { presets } from '../src/schema/build-config';

const schema = patchSchema(addSchema() as any);
const ajv = new Ajv({ $data: true, strict: false });
ajvKeywords(ajv);
const validate = ajv.compile(schema);

describe('test output.buildConfig', () => {
  it('should error, when buildConfig is string, ', () => {
    expect(validate({ output: { buildConfig: 'string-config' } })).toBe(false);
  });

  it('should error, when buildConfig is boolean', () => {
    expect(validate({ output: { buildConfig: true } })).toBe(false);
  });

  it('should error, when buildConfig is number', () => {
    expect(validate({ output: { buildConfig: 1 } })).toBe(false);
  });

  it(`should error, when buildConfig is {target: 'es4'} or [{target: 'es4'}]`, () => {
    expect(validate({ output: { buildConfig: { target: 'es4' } } })).toBe(
      false,
    );
    expect(validate({ output: { buildConfig: [{ target: 'es4' }] } })).toBe(
      false,
    );
  });

  it(`should error, when buildConfig is {format: 'commonjs'} or [{target: 'commonjs'}]`, () => {
    expect(validate({ output: { buildConfig: { format: 'commonjs' } } })).toBe(
      false,
    );
    expect(
      validate({ output: { buildConfig: [{ format: 'commonjs' }] } }),
    ).toBe(false);
  });

  it(`should right, when buildConfig is {target: 'es5'| ...|'esnext'} or [{target: 'es5'|...|'esnext'}]`, () => {
    expect(validate({ output: { buildConfig: { target: 'es5' } } })).toBe(true);
    expect(validate({ output: { buildConfig: { target: 'es6' } } })).toBe(true);
    expect(validate({ output: { buildConfig: { target: 'es2015' } } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: { target: 'es2016' } } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: { target: 'es2017' } } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: { target: 'es2018' } } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: { target: 'es2019' } } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: { target: 'es2020' } } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: { target: 'esnext' } } })).toBe(
      true,
    );

    expect(validate({ output: { buildConfig: [{ target: 'es5' }] } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: [{ target: 'es6' }] } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: [{ target: 'es2015' }] } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: [{ target: 'es2016' }] } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: [{ target: 'es2017' }] } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: [{ target: 'es2018' }] } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: [{ target: 'es2019' }] } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: [{ target: 'es2020' }] } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: [{ target: 'esnext' }] } })).toBe(
      true,
    );
  });

  it(`should right, when buildConfig is {format: 'cjs' | 'esm' | 'umd'} or [{target: 'cjs' | 'esm' | 'umd'}]`, () => {
    expect(validate({ output: { buildConfig: { format: 'cjs' } } })).toBe(true);
    expect(validate({ output: { buildConfig: [{ format: 'cjs' }] } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: { format: 'esm' } } })).toBe(true);
    expect(validate({ output: { buildConfig: [{ format: 'esm' }] } })).toBe(
      true,
    );
    expect(validate({ output: { buildConfig: { format: 'umd' } } })).toBe(true);
    expect(validate({ output: { buildConfig: [{ format: 'umd' }] } })).toBe(
      true,
    );
  });

  it(`should true, when bundleOptions is {externals: ['node_modules']}`, () => {
    expect(
      validate({
        output: {
          buildConfig: { bundleOptions: { externals: ['node_modules'] } },
        },
      }),
    ).toBe(true);
  });

  it(`should error, when bundleOption`, () => {
    expect(
      validate({
        output: {
          buildConfig: { bundleOption: { externals: ['node_modules'] } },
        },
      }),
    ).toBe(false);
  });

  test('should right, when buildPreset is preset string', () => {
    for (const preset of presets) {
      expect(validate({ output: { buildPreset: preset } })).toBe(true);
      expect(preset).toMatchSnapshot();
    }
  });

  test('should error, when buildPreset is not preset string', () => {
    expect(validate({ output: { buildPreset: 'custom-preset' } })).toBe(false);
  });
});
