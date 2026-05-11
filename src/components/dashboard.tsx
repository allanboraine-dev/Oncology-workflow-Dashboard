'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWorkflows, createNewPatientWorkflow } from '@/lib/api';
import Board from './board';
import WorkflowListener from './workflow-listener';
import { LogOut, Loader2, Plus, User, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { StaffProfile } from '@/types';
import { resetAllWorkflows, runDemoSequence } from '@/lib/demo';
import { toast } from 'sonner';

export default function Dashboard({ currentUser, onLogout }: { currentUser: StaffProfile, onLogout: () => void }) {
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newFileNumber, setNewFileNumber] = useState('');
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoProgress, setDemoProgress] = useState('');

  const handleRunDemo = async () => {
    setDemoRunning(true);
    setDemoProgress('Resetting...');
    toast.info('🎬 Demo Mode', { description: 'Resetting all patients to Scheduled...', duration: 3000 });
    await resetAllWorkflows();
    queryClient.invalidateQueries({ queryKey: ['workflows'] });
    setDemoProgress('Running...');
    toast.info('🎬 Demo Mode', { description: 'Auto-walking patients through the pipeline...', duration: 3000 });
    await runDemoSequence((step, total) => {
      setDemoProgress(`${step}/${total}`);
    });
    setDemoProgress('');
    setDemoRunning(false);
    toast.success('🎬 Demo Complete', { description: 'All patients have been moved through the workflow.', duration: 5000 });
  };

  const handleReset = async () => {
    setDemoRunning(true);
    setDemoProgress('Resetting...');
    await resetAllWorkflows();
    queryClient.invalidateQueries({ queryKey: ['workflows'] });
    setDemoProgress('');
    setDemoRunning(false);
    toast.success('♻️ Reset Complete', { description: 'All patients are back in Scheduled.', duration: 4000 });
  };

  const createPatientMutation = useMutation({
    mutationFn: () => createNewPatientWorkflow(newPatientName, newFileNumber),
    onSuccess: () => {
      setIsDialogOpen(false);
      setNewPatientName('');
      setNewFileNumber('');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
    onError: (err) => {
      alert(err.message);
    }
  });

  const { data: workflows, isLoading, error } = useQuery({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !workflows) {
    return <div className="p-8 text-red-500">Error loading workflows.</div>;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <header className="flex h-auto min-h-16 shrink-0 flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-white px-4 py-3 sm:px-6 shadow-sm gap-4 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xl">
            L
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight leading-tight">Lenmed Oncology</h1>
            <p className="text-xs text-slate-500 font-medium">Workflow Overlay</p>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4">
          {currentUser.role !== 'Nurse' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={<Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 h-9 px-3 sm:px-4 shrink-0" />}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Patient</span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Onboard New Patient</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm font-medium text-slate-700">Patient Name</label>
                    <Input 
                      id="name" 
                      value={newPatientName} 
                      onChange={e => setNewPatientName(e.target.value)} 
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="file" className="text-sm font-medium text-slate-700">GoodX/Icon File Number</label>
                    <Input 
                      id="file" 
                      value={newFileNumber} 
                      onChange={e => setNewFileNumber(e.target.value)} 
                      placeholder="e.g. GX-10293"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => createPatientMutation.mutate()} 
                    disabled={!newPatientName || !newFileNumber || createPatientMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {createPatientMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Workflow
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {currentUser.role === 'Admin/Doctor' && (
            <div className="flex items-center gap-1.5">
              <Button
                onClick={handleReset}
                disabled={demoRunning}
                variant="outline"
                className="h-9 px-3 gap-1.5 border-slate-300 text-slate-600 hover:bg-slate-100 shrink-0"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${demoRunning && demoProgress === 'Resetting...' ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <Button
                onClick={handleRunDemo}
                disabled={demoRunning}
                className="h-9 px-3 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shrink-0"
              >
                {demoRunning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="hidden sm:inline">{demoProgress}</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Demo</span>
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 sm:border-l sm:border-slate-200 sm:pl-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-900 leading-tight">{currentUser.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">{currentUser.role}</span>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 overflow-hidden">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} title="Logout" className="ml-0 sm:ml-1 h-9 w-9 shrink-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6">
        <Board workflows={workflows} currentStaff={currentUser} />
      </main>
      <WorkflowListener />
    </div>
  );
}
