import hello from '@api/lambda/index';

export type ProfileData = {
  message: string;
};

export const loader = async (): Promise<ProfileData> => {
  const res = await hello();
  return res;
};
