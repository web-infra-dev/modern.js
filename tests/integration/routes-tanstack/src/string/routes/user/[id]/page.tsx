import { useMatch } from '@modern-js/plugin-tanstack/runtime';

export default function UserPage() {
  const match = useMatch({ from: '/user/$id' });
  const id = match.loaderData!.id;

  return <div id="user">string-user:{id}</div>;
}
