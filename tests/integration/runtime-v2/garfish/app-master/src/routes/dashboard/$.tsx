import { useModuleApps } from '@modern-js/plugin-garfish-v2/runtime';

const Index = () => {
  const { Dashboard } = useModuleApps();

  return (
    <div>
      <Dashboard />
    </div>
  );
};

export default Index;
