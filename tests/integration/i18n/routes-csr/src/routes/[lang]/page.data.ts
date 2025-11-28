import i18next from 'i18next';
export interface ProfileData {
  /*  some types */
  data: string;
}

export const loader = async ({ params }: any): Promise<ProfileData> => {
  return { data: i18next.t('key_1', { lng: params.lang || i18next.language }) };
};
