'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StaffProfile } from '@/types';
import { Loader2, User, Stethoscope, HeartPulse, Building } from 'lucide-react';
import { Card } from '@/components/ui/card';

const ROLE_ICONS: Record<string, any> = {
  'Admin/Doctor': Stethoscope,
  'Nurse': HeartPulse,
  'Reception': Building,
};

export default function Login({ onLogin }: { onLogin: (staff: StaffProfile) => void }) {
  const { data: staffList, isLoading } = useQuery({
    queryKey: ['staff_profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('staff_profiles').select('*').order('role');
      return data as StaffProfile[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 p-6">
      <div className="flex flex-col items-center mb-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-3xl mb-4 shadow-lg">
          L
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lenmed Oncology</h1>
        <p className="text-slate-500 font-medium mt-1">Select your profile to login</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {staffList?.map((staff) => {
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
    </div>
  );
}
