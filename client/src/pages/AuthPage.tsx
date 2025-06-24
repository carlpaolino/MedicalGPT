import React from 'react';

const AuthPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-blue-50 dark:bg-blue-900">
      <div className="bg-white dark:bg-blue-950 rounded-lg shadow-lg p-8 max-w-md w-full border border-blue-200 dark:border-blue-800">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-4">Sign In / Register</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Authentication coming soon.</p>
      </div>
    </div>
  );
};

export default AuthPage; 