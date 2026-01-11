
import React, { useState, useEffect } from 'react';
import HomePage from './page';
import ChatPage from './chat/page';
import LoginPage from './login/page';
import SignupPage from './signup/page';

const AppLayout: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderContent = () => {
    if (route.startsWith('#/chat')) return <ChatPage />;
    if (route.startsWith('#/login')) return <LoginPage />;
    if (route.startsWith('#/signup')) return <SignupPage />;
    return <HomePage />;
  };

  return (
    <div className="antialiased text-slate-900 dark:text-slate-100 bg-background-light dark:bg-background-dark min-h-screen transition-colors duration-300">
      {renderContent()}
    </div>
  );
};

export default AppLayout;
