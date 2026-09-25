import { createCopyWholePackage } from '../../src/plugins/deploy/utils';

describe('createCopyWholePackage', () => {
  it('should copy @modern-js/utils in full by default', () => {
    const copyWholePackage = createCopyWholePackage();

    expect(copyWholePackage('@modern-js/utils')).toBe(true);
    expect(copyWholePackage('react')).toBe(false);
  });

  it('should copy the packages named in deploy.copyWholePackages in full', () => {
    const copyWholePackage = createCopyWholePackage(['zod']);

    expect(copyWholePackage('@modern-js/utils')).toBe(true);
    expect(copyWholePackage('zod')).toBe(true);
    expect(copyWholePackage('react')).toBe(false);
  });
});
