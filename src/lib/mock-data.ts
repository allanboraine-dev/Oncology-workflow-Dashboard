import { Workflow, WorkflowComment, StaffProfile, Patient } from '@/types';

export const mockStaff: StaffProfile[] = [
  { id: 's1', name: 'Dr. Ibrahim', role: 'Admin/Doctor', avatar_url: 'https://i.pravatar.cc/150?u=s1' },
  { id: 's2', name: 'Nurse Lerato', role: 'Nurse', avatar_url: 'https://i.pravatar.cc/150?u=s2' },
  { id: 's3', name: 'Sarah (Reception)', role: 'Reception', avatar_url: 'https://i.pravatar.cc/150?u=s3' },
];

export const mockPatients: Patient[] = [
  { id: 'p1', name: 'John Doe', file_number: 'GX-10293' },
  { id: 'p2', name: 'Jane Smith', file_number: 'IC-99281' },
  { id: 'p3', name: 'Robert Johnson', file_number: 'GX-11029' },
  { id: 'p4', name: 'Emily Davis', file_number: 'IC-88372' },
  { id: 'p5', name: 'Michael Brown', file_number: 'GX-77261' },
];

export const initialWorkflows: Workflow[] = [
  { id: 'w1', patient_id: 'p1', status: 'Scheduled', last_updated: new Date().toISOString(), patient: mockPatients[0], comment_count: 0 },
  { id: 'w2', patient_id: 'p2', status: 'Onboarding', last_updated: new Date().toISOString(), patient: mockPatients[1], comment_count: 2 },
  { id: 'w3', patient_id: 'p3', status: 'Pre-Treatment', last_updated: new Date().toISOString(), patient: mockPatients[2], comment_count: 1 },
  { id: 'w4', patient_id: 'p4', status: 'Active Treatment', last_updated: new Date().toISOString(), patient: mockPatients[3], comment_count: 5 },
  { id: 'w5', patient_id: 'p5', status: 'Observation', last_updated: new Date().toISOString(), patient: mockPatients[4], comment_count: 0 },
];

export const initialComments: WorkflowComment[] = [
  { id: 'c1', workflow_id: 'w2', staff_id: 's3', content: 'Patient arrived and filling out forms.', created_at: new Date(Date.now() - 3600000).toISOString(), staff_profiles: mockStaff[2] },
  { id: 'c2', workflow_id: 'w2', staff_id: 's2', content: 'Vitals taken, waiting for doctor.', created_at: new Date(Date.now() - 1800000).toISOString(), staff_profiles: mockStaff[1] },
  { id: 'c3', workflow_id: 'w3', staff_id: 's1', content: 'Reviewing scans before starting.', created_at: new Date(Date.now() - 7200000).toISOString(), staff_profiles: mockStaff[0] },
];
