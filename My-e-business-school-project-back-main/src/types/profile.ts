/**
 * Types pour la gestion des profils utilisateurs
 */

export interface UserProfile {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  birth_date: Date | null;
  birth_place: string | null;
  created_at: Date;
  is_account_active: boolean;
  roles: string[];
  student_profile?: StudentProfile;
  courses_taught?: CourseSummary[];
}

export interface StudentProfile {
  profile_id: number;
  student_id: number;
  situation: string | null;
  desired_program: string | null;
  desired_start_date: Date | null;
  handicap: boolean | null;
  highest_degree: string | null;
  degree_name: string | null;
  english_level: string | null;
  professional_project: string | null;
  five_year_vision: string | null;
  desired_jobs: string | null;
  interests: string | null;
  professional_experience: string | null;
  hobbies: string | null;
  qualities: string | null;
  weaknesses: string | null;
  company_type_preference: string | null;
  mobility_zone: string | null;
  found_apprenticeship: boolean | null;
  apprenticeship_leads: string | null;
  prior_online_courses: boolean | null;
  online_experience: string | null;
  learning_preference: string | null;
  comfort_virtual_campus: string | null;
  has_computer: boolean | null;
  internet_quality: string | null;
  previous_technical_issues: boolean | null;
  quiet_study_space: boolean | null;
  self_evaluation_virtual_campus: number | null;
  program_expectation_rating: number | null;
  financing_preference: string | null;
  guarantee_place: boolean | null;
  resume: string | null;
}

export interface CourseSummary {
  course_id: number;
  title: string;
  status: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  birth_date?: Date;
  birth_place?: string;
}

export interface UpdatePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateStudentProfileData {
  situation?: string;
  handicap?: boolean;
  highest_degree?: string;
  degree_name?: string;
  english_level?: string;
  professional_project?: string;
  five_year_vision?: string;
  interests?: string;
  hobbies?: string;
  qualities?: string;
  weaknesses?: string;
  mobility_zone?: string;
  has_computer?: boolean;
  internet_quality?: string;
  quiet_study_space?: boolean;
  learning_preference?: string;
  comfort_virtual_campus?: string;
}