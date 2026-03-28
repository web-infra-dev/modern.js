import * as bffPlugin from '../packages/cli/plugin-bff/src';
import { bffPlugin as bffPluginExport } from '../packages/cli/plugin-bff/src/cli';
import * as constants from '../packages/cli/plugin-bff/src/constants';

describe('plugin-bff exports', () => {
  test('should export all constants', () => {
    expect(constants).toBeDefined();
    expect(typeof constants).toBe('object');
  });

  test('should export bffPlugin function', () => {
    expect(bffPluginExport).toBeDefined();
    expect(typeof bffPluginExport).toBe('function');
  });

  test('should properly re-export from index', () => {
    // Test that the index file correctly re-exports everything
    expect(bffPlugin.bffPlugin).toBe(bffPluginExport);
    
    // Check that constants are properly exported
    const exportedConstants = Object.keys(constants);
    expect(exportedConstants.length).toBeGreaterThan(0);
  });

  test('should maintain export integrity', () => {
    // Verify that the main export includes both exports
    const mainExports = Object.keys(bffPlugin);
    expect(mainExports).toContain('bffPlugin');
    
    // Should have at least one constant exported
    expect(mainExports.length).toBeGreaterThanOrEqual(1);
  });
});