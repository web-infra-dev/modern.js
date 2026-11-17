export type LoaderResult = {
  matchedId: string;
};

export const loader = async ({
  params,
}: {
  request: Request;
  params: { id: string };
}): Promise<LoaderResult> => {
  return { matchedId: params.id };
};
