import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/Sidebar';
import DisclaimerBanner from './components/DisclaimerBanner';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gradient-to-br from-blue-50 to-red-50 dark:from-blue-950 dark:to-red-900">
        <Sidebar />
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <DisclaimerBanner />
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/auth/*" element={<AuthPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App; 