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
  _id?: string
  name: string
  position: string
  image_url?: string
}

export interface ActivityScheduleSlot {
  start_time: string
  end_time: string
  title: string
  description?: string
  highlight?: boolean
}

export interface ActivityScheduleItem {
  date: string
  venue?: string
  location_link_gg_map?: string
  location_pics?: string[]
  additional_location_info?: string[]
  slots: ActivityScheduleSlot[]
}

export interface ActivityVenue {
  name: string
  address_lines: string[]
  map_image_url?: string
  directions_url?: string
}

export interface ActivityDetail extends Activity {
  hero_image_url: string
  benefits?: string[]
  speakers?: ActivitySpeaker[]
  schedule: ActivityScheduleItem[]
  extra_questions: ActivityExtraQuestion[]
  open_registration_at?: string
  close_registration_at?: string
  registration_open_override?: boolean
  created_at?: string
  updated_at?: string
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
    education_level?: string
    institution?: string
    address?: string
  }
}

export interface ActivityRegistrationResult {
  ok: boolean
  message?: string
  registration_id?: string
  status?: string
  activity_id?: string
  registered_at?: string
  access_token?: string
  user_data?: any
}
