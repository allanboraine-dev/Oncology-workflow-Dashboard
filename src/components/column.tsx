'use client';

import { StaffProfile, Workflow, WorkflowStatus } from '@/types';
import PatientCard from './patient-card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Column({ 
  status, 
  workflows,
  currentStaff
}: { 
  status: WorkflowStatus; 
  workflows: Workflow[];
  currentStaff: StaffProfile;
}) {
  return (
    <div className="flex w-[85vw] sm:w-80 shrink-0 flex-col rounded-xl bg-slate-100/50 border border-slate-200/60 overflow-hidden snap-center">
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-slate-100/80 px-4 py-3">
        <h3 className="font-semibold text-slate-700">{status}</h3>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
          {workflows.length}
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="flex flex-col gap-3 pb-4">
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-slate-400">No patients</p>
            </div>
          ) : (
            workflows.map(workflow => (
              <PatientCard key={workflow.id} workflow={workflow} currentStaff={currentStaff} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
