// Consumer-side type check for the generated BFF client. The integration test
// compiles this with `skipLibCheck: false` and none of the producer's path
// aliases, so it fails if the declarations copied to dist/client leak a
// tsconfig alias or contain a relative specifier that does not resolve from
// their published location.
import context from 'bff-api-app/api/context/index';
import hello, { post, postHello } from 'bff-api-app/api/index';
import { upload } from 'bff-api-app/api/upload';
import getUser from 'bff-api-app/api/user/[id]';

export const checks = async () => {
  const greeting: { message: string } = await hello();
  const posted: { message: string } = await post();
  const fromContext: { message: string } = await context();
  const user: { id: string; message: string } = await getUser('42');
  return { greeting, posted, fromContext, user, upload, postHello };
};
