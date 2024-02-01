import { FC } from 'react';
import { useSnapshot } from 'valtio';
import { $doctor } from './state';

const Page: FC = () => {
  const doctor = useSnapshot($doctor);
  return <pre>{JSON.stringify(doctor, null, 2)}</pre>;
};

export default Page;
