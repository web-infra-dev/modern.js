export type LoaderResult = {
  matchedId: string;
};

export const loader = async ({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}): Promise<LoaderResult> => {
  return { matchedId: params.id };
};
