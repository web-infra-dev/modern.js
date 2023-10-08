import type { ActionFunction, LoaderFunction } from '@modern-js/runtime/router';
import { modernTestActionName } from '@/common/utils';

const storage = new Map();

export const loader: LoaderFunction = () => {
  const value = storage.get(modernTestActionName);
  return value || null;
};

export const action: ActionFunction = async ({ request }) => {
  try {
    const user = await request.json();
    const { name } = user;
    storage.set(modernTestActionName, name);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
