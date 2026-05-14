export interface Activity {
  id: string
  name: string
  description: string
  date: string
  capacity: number
}

export interface Enrollment {
  id: string
  userId: string
  activityId: string
  enrolledAt: string
}
