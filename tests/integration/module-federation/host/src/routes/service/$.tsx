import { ProducerUpdateControls } from '../../components/ProducerUpdateControls';
import { ServiceMount } from '../../components/ServiceMount';
import { LabNav } from '../../components/Comparison';

export default function ServiceWeather() {
  return (
    <>
      <LabNav />
      <ProducerUpdateControls scenario="service" />
      <ServiceMount />
    </>
  );
}
