import { SectionTitleStatus } from '../constants/log';

export const watchSectionTitle = async (
  str: string,
  status: SectionTitleStatus,
  detailLog?: string,
) => {
  const { chalk } = await import('@modern-js/utils');
  if (status === SectionTitleStatus.Success) {
    return `${chalk.bgWhite.gray.underline(str)} ${chalk.green.underline(
      'Successful',
    )}`;
  } else if (status === SectionTitleStatus.Fail) {
    return `${chalk.bgWhite.gray.underline(str)} ${chalk.red.underline(
      'Build Failed',
    )}`;
  }

  return `${chalk.bgWhite.gray.underline(str)} ${
    detailLog ? detailLog : chalk.blue.underline('Log')
  }`;
};
