import { SectionTitleStatus } from '../constants/log';

export const watchSectionTitle = async (
  str: string,
  status: SectionTitleStatus,
  detailLog?: string,
) => {
  const { chalk } = await import('@modern-js/utils');
  if (status === SectionTitleStatus.Success) {
    return `${chalk.gray(str)} ${chalk.green('Successful')}`;
  } else if (status === SectionTitleStatus.Fail) {
    return `${chalk.gray(str)} ${chalk.red('Build Failed')}`;
  }

  return `${chalk.gray(str)} ${detailLog ? detailLog : 'Log:'}`;
};
