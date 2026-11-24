import { getUser } from '../service/user';

export const get = async () => {
  const fromData =
    await import('data:text/javascript,export { getUser } from "@service/user.js"');
  return { relative: getUser().name, aliasFromData: fromData.getUser().name };
};
