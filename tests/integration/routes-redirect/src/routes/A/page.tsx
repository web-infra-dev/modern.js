import { useLoaderData } from '@modern-js/runtime/router';

type CourseData = {
  A: {
    aKey3: string;
  };
};

const A = () => {
  const AData = useLoaderData() as CourseData;
  console.log({ AData });
  return <div>A Page</div>;
};

export default A;
