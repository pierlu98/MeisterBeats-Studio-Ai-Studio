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
import { supabase } from './services/supabase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user;
      setUser(currentUser ? {
        id: currentUser.id,
        displayName: currentUser.user_metadata.full_name,
        avatarUrl: currentUser.user_metadata.avatar_url,
      } : null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleConnect = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');

  return (
    <div className="min-h-screen bg-[#151619] text-gray-200 font-sans flex flex-col items-center">
      {paymentStatus === 'success' && (
        <div className="w-full p-2 text-center text-sm bg-green-600 text-white">
          Payment successful! Your purchase has been recorded.
        </div>
      )}
      {paymentStatus === 'cancel' && (
        <div className="w-full p-2 text-center text-sm bg-red-600 text-white">
          Payment canceled. You have not been charged.
        </div>
      )}
      <div className="w-full flex-grow flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-7xl">
        <Header user={user} onConnect={handleConnect} onLogout={handleLogout} />
        <Dashboard user={user} />
        </div>
      </div>
    </div>
  );
}
