import { useModuleApps } from '@modern-js/plugin-garfish/runtime';

const Index = () => {
  const { Table } = useModuleApps();

  return (
    <div>
      <Table />
    </div>
  );
};

export default Index;
