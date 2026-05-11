'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/dashboard';
import Login from '@/components/login';
import { StaffProfile } from '@/types';

export default function Home() {
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if a user is already saved in localStorage
    const savedUser = localStorage.getItem('lenmed_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // Ignore error
      }
    }
    setIsLoaded(true);
  }, []);

  const handleLogin = (staff: StaffProfile) => {
    localStorage.setItem('lenmed_user', JSON.stringify(staff));
    setUser(staff);
  };

  const handleLogout = () => {
    localStorage.removeItem('lenmed_user');
    setUser(null);
  };

  if (!isLoaded) return null;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard currentUser={user} onLogout={handleLogout} />;
}
