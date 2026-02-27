// src/types/student.ts
export interface ProfilEtudiant {
    profile_id: number;
    student_id?: number;
    situation?: string;
    desired_program?: string;
    desired_start_date?: Date;
    handicap?: boolean;
    highest_degree?: string;
    degree_name?: string;
    english_level?: string;
    professional_project?: string;
    five_year_vision?: string;
    desired_jobs?: string;
    interests?: string;
    professional_experience?: string;
    hobbies?: string;
    qualities?: string;
    weaknesses?: string;
    company_type_preference?: string;
    mobility_zone?: string;
    found_apprenticeship?: boolean;
    apprenticeship_leads?: string;
    prior_online_courses?: boolean;
    online_experience?: string;
    learning_preference?: string;
    comfort_virtual_campus?: string;
    has_computer?: boolean;
    internet_quality?: string;
    previous_technical_issues?: boolean;
    quiet_study_space?: boolean;
    self_evaluation_virtual_campus?: number;
    program_expectation_rating?: number;
    financing_preference?: string;
    guarantee_place?: boolean;
    resume?: string;
    email?: string;
    address?: string;
    birth_date?: Date;
    birth_place?: string;
    city?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    postal_code?: string;
    cv_file_path?: string;
  }
  
  // Type helper pour création/édition (sans l'ID)
  export type ProfilEtudiantForm = Omit<ProfilEtudiant, "profile_id">;
  
  // État initial du formulaire
  export const initialFormState: ProfilEtudiantForm = {
    situation: "",
    desired_program: "",
    desired_start_date: undefined,
    handicap: false,
    highest_degree: "",
    degree_name: "",
    english_level: "",
    professional_project: "",
    five_year_vision: "",
    desired_jobs: "",
    interests: "",
    professional_experience: "",
    hobbies: "",
    qualities: "",
    weaknesses: "",
    company_type_preference: "",
    mobility_zone: "",
    found_apprenticeship: false,
    apprenticeship_leads: "",
    prior_online_courses: false,
    online_experience: "",
    learning_preference: "",
    comfort_virtual_campus: "",
    has_computer: false,
    internet_quality: "",
    previous_technical_issues: false,
    quiet_study_space: false,
    self_evaluation_virtual_campus: 5,
    program_expectation_rating: 5,
    financing_preference: "",
    guarantee_place: false,
    resume: "",
    email: "",
    address: "",
    birth_date: undefined,
    birth_place: "",
    city: "",
    first_name: "",
    last_name: "",
    phone: "",
    postal_code: "",
  };
  