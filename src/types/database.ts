// Database types for the environmental activities management system

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  total_score: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  is_checkpoint: boolean;
  reward?: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  duration_days: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramActivity {
  id: string;
  program_id: string;
  activity_id: string;
  day_order: number;
  created_at: string;
  // Joined fields
  activity?: Activity;
}

export interface UserProgramEnrollment {
  id: string;
  user_id: string;
  program_id: string;
  enrolled_at: string;
  completed_at?: string;
  is_active: boolean;
  // Joined fields
  program?: Program;
  user_profile?: UserProfile;
}

export interface UserActivityCompletion {
  id: string;
  user_id: string;
  program_id: string;
  activity_id: string;
  completed_at?: string;
  verified_by?: string;
  verified_at?: string;
  is_verified: boolean;
  created_at: string;
  // Joined fields
  activity?: Activity;
  program?: Program;
  user_profile?: UserProfile;
  verifier_profile?: UserProfile;
}

// Extended types for admin views
export interface ProgramWithActivities extends Program {
  activities: ProgramActivity[];
  enrollment_count: number;
}

export interface UserProgressSummary {
  user_id: string;
  user_profile: UserProfile;
  program_id: string;
  program: Program;
  total_activities: number;
  completed_activities: number;
  verified_activities: number;
  pending_verification: number;
  total_score: number;
  progress_percentage: number;
}

export interface BulkVerificationRequest {
  user_ids: string[];
  program_id: string;
  activity_id: string;
  verified_by: string;
}
