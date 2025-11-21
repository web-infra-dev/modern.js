import i18next from '../../../i18n';
export interface ProfileData {
  /*  some types */
  data: string;
}

export const loader = async ({ params }: any): Promise<ProfileData> => {
  console.log(
    '===i18next.t("key")',
    i18next.t('key', { lng: params.lang || i18next.language }),
  );
  return { data: i18next.t('key', { lng: params.lang || i18next.language }) };
};
