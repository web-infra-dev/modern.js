import { useEffect, useState } from 'react';
import './index.css';
import { primaryColorClass } from '@/theme';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <button
        onClick={() => setIsDarkMode(value => !value)}
        className="px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Toggle
      </button>
      <div
        className={`mt-6 w-12 h-12 rounded-full ${primaryColorClass} dark:bg-dark-primary`}
      />
    </div>
  );
};

export default App;
