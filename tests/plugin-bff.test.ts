{"search": "  test('should properly re-export from index', () => {
    // Test that the index file correctly re-exports everything
    expect(bffPlugin.bffPlugin).toBe(bffPluginExport);
    
    // Check that constants are properly exported
    const exportedConstants = Object.keys(constants);
    expect(exportedConstants.length).toBeGreaterThan(0);
  });", "replace": "  test('should properly re-export from index', () => {
    // Test that the index file correctly re-exports everything
    expect(bffPlugin.bffPlugin).toBe(bffPluginExport);
    
    // Check that at least one constant is properly re-exported from the index
    const exportedConstantEntries = Object.entries(constants);
    expect(exportedConstantEntries.length).toBeGreaterThan(0);
    const [firstConstantKey, firstConstantValue] = exportedConstantEntries[0];
    // The index namespace should expose this constant with the same value
    expect(bffPlugin[firstConstantKey]).toBe(firstConstantValue);
  });"}