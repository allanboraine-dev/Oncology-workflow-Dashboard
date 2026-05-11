import { supabase } from './supabase';

type DemoEvent = {
  type: 'status_change' | 'comment';
  patientName: string;
  fileNumber: string;
  delayMs: number;
  toStatus?: string;
  staffId?: string;
  comment?: string;
};

// Staff IDs mapping
const STAFF = {
  DR_IBRAHIM: '277936f6-3d0c-48ea-a76a-431097cee3f3', // Admin/Doctor
  SISTERS: '7023bdb9-7b90-40e7-b5d2-e3056f751894', // Nurse
  ZAYNEEN: '7877e8b8-615b-4d77-b684-149fdb072090', // Reception
  FARZANA: 'd314498e-3701-4468-9ab1-429861fb58e1', // Reception
};

const DEMO_SEQUENCE: DemoEvent[] = [
  // --- Wave 1: Robert Johnson ---
  { type: 'status_change', patientName: 'Robert Johnson', fileNumber: 'GX-11029', toStatus: 'Onboarding', delayMs: 2000 },
  { type: 'comment', patientName: 'Robert Johnson', fileNumber: 'GX-11029', staffId: STAFF.ZAYNEEN, comment: 'Patient arrived, starting onboarding paperwork.', delayMs: 800 },
  
  // --- Wave 2: John Doe joins ---
  { type: 'status_change', patientName: 'John Doe', fileNumber: 'GX-10293', toStatus: 'Onboarding', delayMs: 2000 },
  { type: 'comment', patientName: 'John Doe', fileNumber: 'GX-10293', staffId: STAFF.FARZANA, comment: 'Insurance verified, ID on file.', delayMs: 800 },

  // --- Wave 3: Robert moves to Pre-Treatment ---
  { type: 'status_change', patientName: 'Robert Johnson', fileNumber: 'GX-11029', toStatus: 'Pre-Treatment', delayMs: 2000 },
  { type: 'comment', patientName: 'Robert Johnson', fileNumber: 'GX-11029', staffId: STAFF.SISTERS, comment: 'Vitals taken, prepping for treatment.', delayMs: 800 },
  { type: 'comment', patientName: 'Robert Johnson', fileNumber: 'GX-11029', staffId: STAFF.DR_IBRAHIM, comment: 'Please ensure latest lab results are attached.', delayMs: 800 },

  // --- Wave 4: Jane joins ---
  { type: 'status_change', patientName: 'Jane Smith', fileNumber: 'IC-99281', toStatus: 'Onboarding', delayMs: 2000 },
  
  // --- Wave 5: John moves to Pre-Treatment ---
  { type: 'status_change', patientName: 'John Doe', fileNumber: 'GX-10293', toStatus: 'Pre-Treatment', delayMs: 2000 },
  
  // --- Wave 6: Robert begins Active Treatment ---
  { type: 'status_change', patientName: 'Robert Johnson', fileNumber: 'GX-11029', toStatus: 'Active Treatment', delayMs: 2000 },
  { type: 'comment', patientName: 'Robert Johnson', fileNumber: 'GX-11029', staffId: STAFF.SISTERS, comment: 'IV connected, drip started without complications.', delayMs: 800 },

  // --- Wave 7: Jane moves to Pre-Treatment ---
  { type: 'status_change', patientName: 'Jane Smith', fileNumber: 'IC-99281', toStatus: 'Pre-Treatment', delayMs: 2000 },
  { type: 'comment', patientName: 'Jane Smith', fileNumber: 'IC-99281', staffId: STAFF.SISTERS, comment: 'Patient reporting mild nausea this morning.', delayMs: 800 },
  { type: 'comment', patientName: 'Jane Smith', fileNumber: 'IC-99281', staffId: STAFF.DR_IBRAHIM, comment: 'Administer antiemetic prior to starting cycle.', delayMs: 800 },

  // --- Wave 8: Robert into Observation ---
  { type: 'status_change', patientName: 'Robert Johnson', fileNumber: 'GX-11029', toStatus: 'Observation', delayMs: 2000 },
  
  // --- Wave 9: John into Active Treatment ---
  { type: 'status_change', patientName: 'John Doe', fileNumber: 'GX-10293', toStatus: 'Active Treatment', delayMs: 2000 },
  
  // --- Wave 10: Robert discharged! ---
  { type: 'status_change', patientName: 'Robert Johnson', fileNumber: 'GX-11029', toStatus: 'Discharged', delayMs: 2000 },
  { type: 'comment', patientName: 'Robert Johnson', fileNumber: 'GX-11029', staffId: STAFF.SISTERS, comment: 'Observation complete, no adverse reactions. Discharged.', delayMs: 800 },
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getWorkflowByFileNumber(fileNumber: string) {
  const { data } = await supabase
    .from('workflows')
    .select('id, status, patients!inner(file_number)')
    .eq('patients.file_number', fileNumber)
    .single();
  return data;
}

export async function resetAllWorkflows() {
  // Get all workflows
  const { data: workflows } = await supabase
    .from('workflows')
    .select('id');

  if (!workflows) return;

  // Delete all comments to start fresh
  await supabase.from('workflow_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Reset all to Scheduled
  await Promise.all(
    workflows.map(w =>
      supabase
        .from('workflows')
        .update({ status: 'Scheduled', last_updated: new Date().toISOString() })
        .eq('id', w.id)
    )
  );

  // Small delay to let the real-time listener process
  await sleep(1000);
}

export async function runDemoSequence(onProgress?: (step: number, total: number) => void) {
  const total = DEMO_SEQUENCE.length;

  for (let i = 0; i < DEMO_SEQUENCE.length; i++) {
    const event = DEMO_SEQUENCE[i];
    onProgress?.(i + 1, total);

    await sleep(event.delayMs);

    const workflow = await getWorkflowByFileNumber(event.fileNumber);
    if (!workflow) continue;

    if (event.type === 'status_change' && event.toStatus) {
      await supabase
        .from('workflows')
        .update({ status: event.toStatus, last_updated: new Date().toISOString() })
        .eq('id', workflow.id);
    } else if (event.type === 'comment' && event.comment && event.staffId) {
      await supabase
        .from('workflow_comments')
        .insert([
          {
            workflow_id: workflow.id,
            staff_id: event.staffId,
            content: event.comment,
          }
        ]);
        
      // Also touch the workflow last_updated so the comment count badge flashes
      await supabase
        .from('workflows')
        .update({ last_updated: new Date().toISOString() })
        .eq('id', workflow.id);
    }
  }

  onProgress?.(total, total);
}
