'use client';

import { StaffProfile, Workflow, WorkflowStatus } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import WorkflowSheet from './workflow-sheet';

const STAGES: WorkflowStatus[] = [
  'Scheduled',
  'Onboarding',
  'Pre-Treatment',
  'Active Treatment',
  'Observation',
  'Discharged',
];

const STAGE_COLORS: Record<WorkflowStatus, string> = {
  'Scheduled': 'bg-slate-400',
  'Onboarding': 'bg-blue-500',
  'Pre-Treatment': 'bg-amber-500',
  'Active Treatment': 'bg-rose-500',
  'Observation': 'bg-violet-500',
  'Discharged': 'bg-emerald-500',
};

export default function PatientCard({ 
  workflow,
  currentStaff
}: { 
  workflow: Workflow;
  currentStaff: StaffProfile;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const patient = workflow.patient;
  const currentStageIndex = STAGES.indexOf(workflow.status);

  if (!patient) return null;

  return (
    <>
      <Card 
        onClick={() => setSheetOpen(true)}
        className="group relative cursor-pointer overflow-hidden border border-slate-200 bg-white p-4 transition-all hover:border-teal-500 hover:shadow-md hover:shadow-teal-100"
      >
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
              {patient.name}
            </h4>
            <p className="text-xs font-medium text-slate-500 mt-1">
              File: {patient.file_number}
            </p>
          </div>
        </div>

        {/* Stage Progress Indicator */}
        <div className="mt-3 flex items-center gap-1">
          {STAGES.map((stage, i) => (
            <div
              key={stage}
              title={stage}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= currentStageIndex
                  ? STAGE_COLORS[workflow.status]
                  : 'bg-slate-100'
              } ${i === currentStageIndex ? 'ring-1 ring-offset-1 ring-current opacity-100' : 'opacity-70'}`}
            />
          ))}
        </div>
        <p className="text-[10px] mt-1 text-slate-400 font-medium flex items-center gap-1">
          {currentStageIndex > 0 && (
            <>
              <span className="text-slate-300">{STAGES[currentStageIndex - 1]}</span>
              <ArrowRight className="h-2.5 w-2.5 text-slate-300" />
            </>
          )}
          <span className="text-slate-600">{workflow.status}</span>
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(workflow.last_updated))} ago</span>
          </div>
          
          {(workflow.comment_count ?? 0) > 0 && (
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium px-2 py-0.5 text-xs border-teal-100 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {workflow.comment_count}
            </Badge>
          )}
        </div>
        
        {/* Accent line on hover */}
        <div className="absolute left-0 top-0 h-full w-1 bg-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />
      </Card>

      <WorkflowSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        workflow={workflow} 
        currentStaff={currentStaff}
      />
    </>
  );
}
