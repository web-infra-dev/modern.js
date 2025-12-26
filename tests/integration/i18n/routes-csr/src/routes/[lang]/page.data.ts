import type { ActionFunction } from '@modern-js/runtime/router';
import i18next from 'i18next';
export interface ProfileData {
  /*  some types */
  data: string;
}

export const loader = async ({ params }: any): Promise<ProfileData> => {
  return { data: i18next.t('key_1', { lng: params.lang || i18next.language }) };
};

export const action: ActionFunction = async ({ request, params }) => {
  const { language } = await request.json();
  // 返回成功状态，action 执行完后会自动重新执行 loader
  return { success: true, language };
};
