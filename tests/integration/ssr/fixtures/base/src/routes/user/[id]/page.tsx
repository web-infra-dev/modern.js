import { useLoaderData } from '@modern-js/runtime/router';

export interface User {
  name: string;
  age: number;
}

const Page = () => {
  const user = useLoaderData() as User;

  return (
    <div>
      user info:
      <div id="data">
        {user.name}-{user.age}
      </div>
    </div>
  );
};

export default Page;
