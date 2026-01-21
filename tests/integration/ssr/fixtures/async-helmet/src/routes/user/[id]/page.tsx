import { Helmet } from '@modern-js/runtime/head';
import { useLoaderData } from '@modern-js/runtime/router';

export default function UserPage() {
  const { name, age } = useLoaderData() as { name: string; age: number };

  return (
    <div>
      <Helmet>
        <title>User: {name} - Async Helmet Test</title>
        <meta name="description" content={`Profile page for user ${name}`} />
        <meta property="og:title" content={`${name}'s Profile`} />
        <meta
          property="og:description"
          content={`User ${name} is ${age} years old`}
        />
      </Helmet>
      <h1>User Profile</h1>
      <div id="user-name">Name: {name}</div>
      <div id="user-age">Age: {age}</div>
    </div>
  );
}

export async function loader({ params }: { params: { id: string } }) {
  return {
    name: `user${params.id}`,
    age: 18,
  };
}
