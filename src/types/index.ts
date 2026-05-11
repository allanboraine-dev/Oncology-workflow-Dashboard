export type Role = 'Admin/Doctor' | 'Nurse' | 'Reception';

export type StaffProfile = {
  id: string;
  name: string;
  role: Role;
  avatar_url?: string;
};

export type Patient = {
  id: string;
  name: string;
  file_number: string;
};

export type WorkflowStatus = 
  | 'Scheduled' 
  | 'Onboarding' 
  | 'Pre-Treatment' 
  | 'Active Treatment' 
  | 'Observation' 
  | 'Discharged';

export type Workflow = {
  id: string;
  patient_id: string;
  status: WorkflowStatus;
  last_updated: string;
  patient?: Patient;
  comment_count?: number;
};

export type WorkflowComment = {
  id: string;
  workflow_id: string;
  staff_id: string;
  content: string;
  created_at: string;
  workflow_status?: string;
  staff_profiles?: StaffProfile;
};

export type WorkflowDocument = {
  id: string;
  workflow_id: string;
  staff_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  staff_profiles?: StaffProfile;
};
