import { watchSectionTitle } from '../src/utils/log';
import { SectionTitleStatus } from '../src/constants/log';

describe('utils/log.ts', () => {
  it('watchSectionTitle', async () => {
    expect(
      await watchSectionTitle('watching', SectionTitleStatus.Log),
    ).toBeDefined();
    expect(
      await watchSectionTitle('watching', SectionTitleStatus.Fail),
    ).toBeDefined();
    expect(
      await watchSectionTitle('watching', SectionTitleStatus.Success),
    ).toBeDefined();
  });
});
