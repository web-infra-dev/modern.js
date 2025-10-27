import './app.css';
import 'tailwindcss/base.css';
import 'tailwindcss/components.css';
import 'tailwindcss/utilities.css';
import { useEffect, useState } from 'react';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 bg-blue-500 dark:bg-blue-700 text-white rounded-md shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <section className="mb-10 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900/30 transition-colors duration-300">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary dark:bg-dark-primary mb-1" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              bg-primary
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-secondary dark:bg-dark-secondary mb-1" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              bg-secondary
            </span>
          </div>
        </div>
      </section>

      <section className="mb-10 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900/30 transition-colors duration-300">
        <div className="space-y-6">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                text
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 text-shadow text-gray-800 dark:text-gray-200">
                shadow text
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900/30 transition-colors duration-300">
        <div className="space-y-4">
          <div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <button className="btn bg-blue-500 dark:bg-blue-700 text-white">
                  addComponents .btn
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
