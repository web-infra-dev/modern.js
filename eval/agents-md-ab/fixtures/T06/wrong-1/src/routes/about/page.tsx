// WRONG: loader defined inside the page component file, no page.data.ts
export const loader = async () => {
  return { title: 'About Us' };
};

const AboutPage = () => {
  return <h1>About Us</h1>;
};

export default AboutPage;
