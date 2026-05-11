'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { WorkflowStatus } from '@/types';

const STAGE_ORDER: WorkflowStatus[] = [
  'Scheduled',
  'Onboarding',
  'Pre-Treatment',
  'Active Treatment',
  'Observation',
  'Discharged',
];

const STAGE_EMOJI: Record<WorkflowStatus, string> = {
  'Scheduled': '📋',
  'Onboarding': '🏥',
  'Pre-Treatment': '🔬',
  'Active Treatment': '💉',
  'Observation': '👁️',
  'Discharged': '✅',
};

export default function WorkflowListener() {
  const queryClient = useQueryClient();
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (isSubscribed.current) return;
    isSubscribed.current = true;

    const channel = supabase
      .channel('workflow-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflows',
        },
        async (payload) => {
          const oldStatus = (payload.old as any)?.status as WorkflowStatus | undefined;
          const newStatus = (payload.new as any)?.status as WorkflowStatus;
          const patientId = (payload.new as any)?.patient_id;

          // Fetch the patient name for a friendlier toast
          let patientName = 'A patient';
          if (patientId) {
            const { data } = await supabase
              .from('patients')
              .select('name')
              .eq('id', patientId)
              .single();
            if (data) patientName = data.name;
          }

          const emoji = STAGE_EMOJI[newStatus] || '📌';

          if (oldStatus && oldStatus !== newStatus) {
            const oldIndex = STAGE_ORDER.indexOf(oldStatus);
            const newIndex = STAGE_ORDER.indexOf(newStatus);
            const direction = newIndex > oldIndex ? 'advanced' : 'moved back';

            toast.info(`${emoji} ${patientName} ${direction}`, {
              description: `${oldStatus} → ${newStatus}`,
              duration: 6000,
            });
          }

          // Refresh the board data
          queryClient.invalidateQueries({ queryKey: ['workflows'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflows',
        },
        async (payload) => {
          const patientId = (payload.new as any)?.patient_id;
          let patientName = 'A new patient';
          if (patientId) {
            const { data } = await supabase
              .from('patients')
              .select('name')
              .eq('id', patientId)
              .single();
            if (data) patientName = data.name;
          }

          toast.success(`📋 ${patientName} added`, {
            description: 'New workflow created in Scheduled',
            duration: 5000,
          });

          queryClient.invalidateQueries({ queryKey: ['workflows'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_comments',
        },
        async (payload) => {
          const staffId = (payload.new as any)?.staff_id;
          const workflowId = (payload.new as any)?.workflow_id;
          const content = (payload.new as any)?.content;
          
          let patientName = 'A patient';
          let staffName = 'Someone';

          if (workflowId) {
            const { data: workflowData } = await supabase
              .from('workflows')
              .select('patients(name)')
              .eq('id', workflowId)
              .single();
            if (workflowData && (workflowData.patients as any)?.name) {
              patientName = (workflowData.patients as any).name;
            }
          }

          if (staffId) {
            const { data: staffData } = await supabase
              .from('staff_profiles')
              .select('name')
              .eq('id', staffId)
              .single();
            if (staffData) staffName = staffData.name;
          }

          toast('💬 New Message', {
            description: `${staffName} commented on ${patientName}'s workflow: "${content}"`,
            duration: 6000,
          });

          // Refresh the board data to update the comment count badge
          queryClient.invalidateQueries({ queryKey: ['workflows'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      isSubscribed.current = false;
    };
  }, [queryClient]);

  return null; // This is a headless listener component
}
