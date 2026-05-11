'use client';

import { StaffProfile, Workflow, WorkflowStatus } from '@/types';
import Column from './column';

const COLUMNS: WorkflowStatus[] = [
  'Scheduled',
  'Onboarding',
  'Pre-Treatment',
  'Active Treatment',
  'Observation',
  'Discharged',
];

export default function Board({ workflows, currentStaff }: { workflows: Workflow[], currentStaff: StaffProfile }) {
  // Role-based visibility logic
  const isDoctorOrAdmin = currentStaff.role === 'Admin/Doctor';
  
  const visibleColumns = COLUMNS.filter(col => {
    if (isDoctorOrAdmin) return true;
    if (currentStaff.role === 'Reception') {
      return ['Scheduled', 'Onboarding'].includes(col);
    }
    if (currentStaff.role === 'Nurse') {
      return ['Onboarding', 'Pre-Treatment', 'Active Treatment', 'Observation'].includes(col);
    }
    return true;
  });

  return (
    <div className="flex h-full gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
      {visibleColumns.map(status => (
        <Column 
          key={status} 
          status={status} 
          workflows={workflows.filter(w => w.status === status)} 
          currentStaff={currentStaff}
        />
      ))}
    </div>
  );
}
