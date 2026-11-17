function Profile() {
  return <div>Profile Component</div>;
}

export const loader = async ({ request: _request }: { request: Request }) => {
  const user = new Promise(resolve =>
    setTimeout(() => resolve('John Doe'), 500),
  );

  return { user, Profile: <Profile /> };
};
