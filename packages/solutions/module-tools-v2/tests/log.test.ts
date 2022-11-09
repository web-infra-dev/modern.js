import { watchSectionTitle } from '../src/utils/log';
import { SectionTitleStatus } from '../src/constants/log';

describe('utils/log.ts', () => {
  it('watchSectionTitle', () => {
    expect(
      watchSectionTitle('watching', SectionTitleStatus.Log),
    ).toMatchSnapshot();
    expect(
      watchSectionTitle('watching', SectionTitleStatus.Fail),
    ).toMatchSnapshot();
    expect(
      watchSectionTitle('watching', SectionTitleStatus.Success),
    ).toMatchSnapshot();
  });
});
