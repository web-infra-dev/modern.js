export const loader = () => {
  throw new Response(
    JSON.stringify({
      message: "can't found the user",
    }),
    {
      status: 255,
    },
  );
};
