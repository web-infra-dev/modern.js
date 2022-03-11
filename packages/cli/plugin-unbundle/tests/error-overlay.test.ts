describe('unbundle error-overlay test', () => {
  it('test error overlay initialize', () => {
    jest.isolateModules(() => {
      jest.spyOn(customElements, 'define');
      require('../src/client/error-overlay');
      expect(customElements.define).toHaveBeenCalled();
      const [, OverlayConstructor] = jest.mocked(customElements.define).mock
        .calls[0];
      const overlay = new OverlayConstructor({
        title: 'test-error',
        message: 'this is a test',
        frame: undefined,
        loc: undefined,
        stack: undefined,
      }) as any;
      expect(overlay).toBeTruthy();
      overlay.connectedCallback();
      overlay.disconnectedCallback();
    });
  });
});

export {};
