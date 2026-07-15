export const loader = async () => ({ items: [] as string[] });

export const action = async ({ request }: { request: Request }) => {
  const form = await request.formData();
  void form.get('text');
  return { ok: true };
};
