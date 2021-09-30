export const get = (id: string) => ({ id });

export const post = (id: string, { data }: { data: Record<string, any> }) => ({
  id,
  data,
});
