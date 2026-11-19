import { resolveTsRuntimeRegisterMode } from '../../src/utils/register';

const originalTypeScriptFeature = Object.getOwnPropertyDescriptor(
  process.features,
  'typescript',
);

const setNativeTypeScriptSupport = (value: boolean | string | undefined) => {
  Object.defineProperty(process.features, 'typescript', {
    value,
    configurable: true,
    writable: true,
  });
};

describe('resolveTsRuntimeRegisterMode', () => {
  afterEach(() => {
    if (originalTypeScriptFeature) {
      Object.defineProperty(
        process.features,
        'typescript',
        originalTypeScriptFeature,
      );
    } else {
      Reflect.deleteProperty(process.features, 'typescript');
    }
  });

  it('should follow node major fallback when native capability is undefined', () => {
    setNativeTypeScriptSupport(undefined);
    const expected =
      Number(process.versions.node.split('.')[0]) >= 22
        ? 'node-loader'
        : 'unsupported';
    expect(resolveTsRuntimeRegisterMode(false, 'module')).toBe(expected);
  });

  it('should prefer native capability over node version', () => {
    setNativeTypeScriptSupport(true);
    expect(resolveTsRuntimeRegisterMode(false, 'module')).toBe('node-loader');
  });

  it('should treat string native capability as supported', () => {
    setNativeTypeScriptSupport('strip');
    expect(resolveTsRuntimeRegisterMode(false, 'module')).toBe('node-loader');
  });

  it('should not fallback to node version when native capability is false', () => {
    setNativeTypeScriptSupport(false);
    expect(resolveTsRuntimeRegisterMode(false, 'module')).toBe('unsupported');
  });

  it('should choose swc for commonjs projects without ts-node', () => {
    setNativeTypeScriptSupport('strip');
    expect(resolveTsRuntimeRegisterMode(false)).toBe('swc');
    setNativeTypeScriptSupport(false);
    expect(resolveTsRuntimeRegisterMode(false, 'commonjs')).toBe('swc');
  });

  it('should choose ts-node when ts-node exists and native support is enabled', () => {
    setNativeTypeScriptSupport('strip');
    expect(resolveTsRuntimeRegisterMode(true)).toBe('ts-node');
  });
});
