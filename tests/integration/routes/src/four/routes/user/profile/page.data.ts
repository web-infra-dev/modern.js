import { ActionFunction, LoaderFunction } from '@modern-js/runtime/router';
import { modernTestActionName } from '@/common/utils';

export const loader: LoaderFunction = () => {
  const value = sessionStorage.getItem(modernTestActionName);
  return value;
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get('name') as string;
  sessionStorage.setItem(modernTestActionName, name);
  return null;
};
