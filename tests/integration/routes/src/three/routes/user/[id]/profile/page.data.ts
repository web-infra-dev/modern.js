import { ActionFunction, LoaderFunction } from '@modern-js/runtime/router';
import { modernTestActionName } from '@/common/utils';

const storage = new Map();

export const loader: LoaderFunction = () => {
  const value = storage.get(modernTestActionName);
  return value || null;
};

export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    storage.set(modernTestActionName, name);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
