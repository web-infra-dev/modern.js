import { useLoaderData } from '@modern-js/runtime/router';

const AboutPage = () => {
  const { title } = useLoaderData() as { title: string };
  return <h1>{title}</h1>;
};

export default AboutPage;
