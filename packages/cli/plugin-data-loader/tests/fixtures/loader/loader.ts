async function loader() {
  return 'request profile page';
}
async function loader2() {
  return 'request profile layout';
}
const loader3 = async () => {
  return {
    message: 'hello user',
  };
};

// src/routes/layout.tsx
const loader4 = async () => {
  return {
    message: 'from  server',
  };
};
export {
  loader as loader_0,
  loader2 as loader_1,
  loader3 as loader_2,
  loader4 as loader_3,
};
