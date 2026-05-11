'use client';

import { useState, lazy, Suspense } from 'react';
import Login from '@/components/login';
import { StaffProfile } from '@/types';
import { Loader2 } from 'lucide-react';

const Dashboard = lazy(() => import('@/components/dashboard'));

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

  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    }>
      <Dashboard currentUser={user} onLogout={handleLogout} />
    </Suspense>
  );
}
