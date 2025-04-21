import hello from '@api/index';

export type ProfileData = {
  message: string;
};

export const loader = async (): Promise<ProfileData> => {
  const res = await hello();
  return res;
};
