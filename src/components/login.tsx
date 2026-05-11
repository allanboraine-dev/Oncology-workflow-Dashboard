'use client';

import { StaffProfile } from '@/types';
import { User, Stethoscope, HeartPulse, Building } from 'lucide-react';
import { Card } from '@/components/ui/card';

const ROLE_ICONS: Record<string, any> = {
  'Admin/Doctor': Stethoscope,
  'Nurse': HeartPulse,
  'Reception': Building,
};

const STAFF_PROFILES: StaffProfile[] = [
  { id: '277936f6-3d0c-48ea-a76a-431097cee3f3', name: 'Dr. Ibrahim', role: 'Admin/Doctor', avatar_url: 'https://i.pravatar.cc/150?u=s1' },
  { id: '7023bdb9-7b90-40e7-b5d2-e3056f751894', name: 'Sisters', role: 'Nurse', avatar_url: null },
  { id: '7877e8b8-615b-4d77-b684-149fdb072090', name: 'Zayneen', role: 'Reception', avatar_url: null },
  { id: 'd314498e-3701-4468-9ab1-429861fb58e1', name: 'Farzana', role: 'Reception', avatar_url: null },
];

export default function Login({ onLogin }: { onLogin: (staff: StaffProfile) => void }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 p-6">
      <div className="flex flex-col items-center mb-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-3xl mb-4 shadow-lg">
          L
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-center">Dr S Ibrahim Oncology Patient Dashboard</h1>
        <p className="text-slate-500 font-medium mt-1">Select your profile to login</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {STAFF_PROFILES.map((staff) => {
          const Icon = ROLE_ICONS[staff.role] || User;
          return (
            <Card 
              key={staff.id} 
              onClick={() => onLogin(staff)}
              className="group flex flex-col items-center justify-center p-8 cursor-pointer border border-slate-200 hover:border-teal-500 hover:shadow-md hover:-translate-y-1 transition-all bg-white"
            >
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-teal-50 transition-colors">
                <Icon className="h-8 w-8 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-teal-700 transition-colors text-center">{staff.name}</h2>
              <span className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{staff.role}</span>
            </Card>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm font-semibold text-slate-400 tracking-wide">
          Developed by <span className="text-teal-600">BORAINE TECH</span>
        </p>
      </div>
    </div>
  );
}
