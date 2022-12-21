type LoaderData = string;

const loader = async (): Promise<LoaderData> => {
  return 'root layout';
};

export default loader;
