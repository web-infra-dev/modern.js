import { Api, Post, Query } from '@modern-js/runtime/server';
import { z } from 'zod';

const UserSchema = z.object({
  phone: z.string(),
});

export const email = Api(Post('/email'), Query(UserSchema), async () => {
  return {
    data: {
      code: 0,
    },
  };
});

export default async () => {
  console.log('User get bff-api-app');
  return {
    message: 'User get bff-api-app',
  };
};

export const post = async () => {
  console.log('User post bff-api-app');
  return {
    message: 'User post bff-api-app12',
  };
};
