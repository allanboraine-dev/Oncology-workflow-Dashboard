'use client';

import { StaffProfile, Workflow, WorkflowStatus } from '@/types';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWorkflowStatus } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import CommentFeed from './comment-feed';
import { Separator } from '@/components/ui/separator';

import DocumentList from './document-list';
import { useState } from 'react';

const STATUS_OPTIONS: WorkflowStatus[] = [
  'Scheduled',
  'Onboarding',
  'Pre-Treatment',
  'Active Treatment',
  'Observation',
  'Discharged',
];

export default function WorkflowSheet({
  open,
  onOpenChange,
  workflow,
  currentStaff
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: Workflow;
  currentStaff: StaffProfile;
}) {
  const queryClient = useQueryClient();
  const patient = workflow.patient;
  const [activeTab, setActiveTab] = useState<'comments' | 'documents'>('comments');

  const updateMutation = useMutation({
    mutationFn: (status: WorkflowStatus) => updateWorkflowStatus(workflow.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const isDoctorOrAdmin = currentStaff.role === 'Admin/Doctor';
  const visibleStatusOptions = STATUS_OPTIONS.filter(status => {
    if (isDoctorOrAdmin) return true;
    if (currentStaff.role === 'Reception') {
      return ['Scheduled', 'Onboarding', 'Pre-Treatment', 'Discharged'].includes(status);
    }
    if (currentStaff.role === 'Nurse') {
      return ['Onboarding', 'Pre-Treatment', 'Active Treatment', 'Observation', 'Discharged'].includes(status);
    }
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-slate-50 border-l-slate-200 p-0 sm:p-0">
        <div className="flex flex-col h-full">
          
          {/* Top Section: Header & Status */}
          <div className="p-6 bg-white shadow-sm shrink-0">
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                {patient?.name}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-slate-500 font-medium">
                <span>File: {patient?.file_number}</span>
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6 flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Current Pipeline Stage
              </label>
              <Select 
                value={workflow.status} 
                onValueChange={(val) => updateMutation.mutate(val as WorkflowStatus)}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:ring-teal-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {visibleStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex bg-white border-y border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'comments' 
                  ? 'border-teal-600 text-teal-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'documents' 
                  ? 'border-teal-600 text-teal-700' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Documents
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'comments' ? (
              <CommentFeed workflowId={workflow.id} currentStaff={currentStaff} />
            ) : (
              <DocumentList workflowId={workflow.id} currentStaff={currentStaff} />
            )}
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
