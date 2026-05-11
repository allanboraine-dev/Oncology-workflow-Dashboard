'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/dashboard';
import Login from '@/components/login';
import { StaffProfile } from '@/types';

export default function Home() {
  const [user, setUser] = useState<StaffProfile | null>(null);

  const handleLogin = (staff: StaffProfile) => {
    setUser(staff);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard currentUser={user} onLogout={handleLogout} />;
}
