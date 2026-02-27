// Types et interfaces pour le module Planning

export interface SlotEvent {
  slot_id?: number;
  title: string;
  start: Date;
  end: Date;
  categorie: string;
  room: string;
  teacher?: string;
  course_id?: number;
  formation_id?: number;
  teacher_id?: number;
}

export interface Teacher {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Formation {
  formation_id: number;
  title: string;
  level?: string;
}

export interface Course {
  course_id: number;
  title: string;
  course_type?: string;
}

export interface FormData {
  course_id: string;
  formation_id: string;
  teacher_id: string;
  room: string;
  date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_type: string;
  recurrence_mode: string;
  recurrence_count: number;
}