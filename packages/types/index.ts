export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: any
  error?: any
}

export interface Activity {
  _id: string
  name: string
  description: string
  price: number
  seat_capacity: number
  enrolled_count: number
  tags: string[]
  is_registration_open: boolean
  is_featured: boolean
}

export interface Enrollment {
  _id: string
  user_id: string
  activity_id: string
  status: string
  registered_at: string
}

export interface ActivityExtraQuestion {
  question_id: string
  question_text: string
  type?: string
  options?: string[]
  is_required?: boolean
  placeholder?: string
}

export interface ActivitySpeaker {
  name: string
  role: string
  avatar_url?: string
}

export interface ActivityScheduleItem {
  date: string
  start_time: string
  end_time: string
  venue?: string
  title?: string
  description?: string
  /** First / current item can be highlighted in UI */
  highlight?: boolean
}

export interface ActivityVenue {
  name: string
  address_lines: string[]
  map_image_url?: string
  directions_url?: string
}

export interface ActivityDetail extends Activity {
  hero_image_url: string
  venue?: ActivityVenue
  highlights?: string[]
  speaker?: ActivitySpeaker
  schedule: ActivityScheduleItem[]
  extra_questions: ActivityExtraQuestion[]
}

export interface ActivityRegistrationPayload {
  activity_id: string
  custom_answers: Array<{ question_id: string; answer: string }>
  new_user?: {
    first_name: string
    last_name: string
    nickname: string
    email: string
    phone: string
    password?: string
    gender?: string
  }
}

export interface ActivityRegistrationResult {
  ok: boolean
  message?: string
  registration_id?: string
  status?: string
  activity_id?: string
  registered_at?: string
}
