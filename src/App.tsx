/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const user = await response.json();
        setUser(user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        fetchUser();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/url');
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-[#151619] text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl">
        <Header user={user} onConnect={handleConnect} onLogout={handleLogout} />
        <Dashboard user={user} />
      </div>
    </div>
  );
}
