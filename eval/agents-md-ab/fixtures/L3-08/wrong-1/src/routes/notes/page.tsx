import { useLoaderData } from '@modern-js/runtime/router';

export const action = async ({ request }: { request: Request }) => {
  const form = await request.formData();
  void form.get('text');
  return { ok: true };
};

const NotesPage = () => {
  const data = useLoaderData() as { items: string[] };
  return (
    <ul>
      {data.items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

export default NotesPage;
