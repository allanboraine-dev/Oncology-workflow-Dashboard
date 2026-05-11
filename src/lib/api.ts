import { Workflow, WorkflowComment, WorkflowStatus } from '@/types';
import { supabase } from './supabase';

export const fetchWorkflows = async (): Promise<Workflow[]> => {
  const { data, error } = await supabase
    .from('workflows')
    .select(`
      *,
      patient:patients(*),
      comments:workflow_comments(count)
    `);

  if (error) {
    console.error('Error fetching workflows:', error);
    throw new Error(error.message);
  }

  // Format the response to map the comment count correctly
  return data.map((w: any) => ({
    ...w,
    patient: Array.isArray(w.patient) ? w.patient[0] : w.patient,
    comment_count: w.comments?.[0]?.count || 0
  }));
};

export const updateWorkflowStatus = async (id: string, status: WorkflowStatus): Promise<Workflow> => {
  const { data, error } = await supabase
    .from('workflows')
    .update({ 
      status, 
      last_updated: new Date().toISOString() 
    })
    .eq('id', id)
    .select(`
      *,
      patient:patients(*)
    `)
    .single();

  if (error) {
    console.error('Error updating workflow status:', error);
    throw new Error(error.message);
  }

  return {
    ...data,
    patient: Array.isArray(data.patient) ? data.patient[0] : data.patient
  };
};

export const fetchComments = async (workflowId: string): Promise<WorkflowComment[]> => {
  const { data, error } = await supabase
    .from('workflow_comments')
    .select(`
      *,
      staff_profiles(*)
    `)
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw new Error(error.message);
  }

  return data.map((c: any) => ({
    ...c,
    staff_profiles: Array.isArray(c.staff_profiles) ? c.staff_profiles[0] : c.staff_profiles
  }));
};

export const addComment = async (workflowId: string, content: string, staffId: string, workflowStatus?: string): Promise<WorkflowComment> => {
  const { data, error } = await supabase
    .from('workflow_comments')
    .insert([
      {
        workflow_id: workflowId,
        staff_id: staffId,
        content,
        workflow_status: workflowStatus,
      }
    ])
    .select(`
      *,
      staff_profiles(*)
    `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw new Error(error.message);
  }

  return {
    ...data,
    staff_profiles: Array.isArray(data.staff_profiles) ? data.staff_profiles[0] : data.staff_profiles
  };
};

export const createNewPatientWorkflow = async (name: string, fileNumber: string) => {
  // 1. Insert patient
  const { data: patientData, error: patientError } = await supabase
    .from('patients')
    .insert([{ name, file_number: fileNumber }])
    .select()
    .single();

  if (patientError) {
    throw new Error('Failed to create patient. Make sure the file number is unique.');
  }

  // 2. Insert workflow
  const { data: workflowData, error: workflowError } = await supabase
    .from('workflows')
    .insert([{ patient_id: patientData.id, status: 'Scheduled' }])
    .select(`*, patient:patients(*)`)
    .single();

  if (workflowError) {
    throw new Error('Failed to create workflow: ' + workflowError.message);
  }

  return { 
    ...workflowData, 
    patient: Array.isArray(workflowData.patient) ? workflowData.patient[0] : workflowData.patient 
  };
};

export const fetchDocuments = async (workflowId: string) => {
  const { data, error } = await supabase
    .from('workflow_documents')
    .select(`
      *,
      staff_profiles (*)
    `)
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const uploadDocument = async (workflowId: string, staffId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${workflowId}/${fileName}`;

  // 1. Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('patient_files')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error('Upload failed: ' + uploadError.message);
  }

  // 2. Create record in workflow_documents table
  const { data, error: dbError } = await supabase
    .from('workflow_documents')
    .insert([
      {
        workflow_id: workflowId,
        staff_id: staffId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
      }
    ])
    .select()
    .single();

  if (dbError) {
    throw new Error('Database insert failed: ' + dbError.message);
  }

  return data;
};

export const getDocumentUrl = (filePath: string) => {
  const { data } = supabase.storage
    .from('patient_files')
    .getPublicUrl(filePath);
  return data.publicUrl;
};
