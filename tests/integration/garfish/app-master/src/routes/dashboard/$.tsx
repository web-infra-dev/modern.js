import { useModuleApps } from '@modern-js/plugin-garfish/runtime';

const Index = () => {
  const { Dashboard } = useModuleApps();

  return (
    <div>
      <Dashboard />
    </div>
  );
};

export default Index;
