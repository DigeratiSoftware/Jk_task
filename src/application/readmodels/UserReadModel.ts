// Read models for optimized queries
export interface UserReadModel {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  documentCount: number
  qaSessionCount: number
}

export interface UserStatsReadModel {
  totalUsers: number
  activeUsers: number
  usersByRole: Record<string, number>
  newUsersThisMonth: number
  topActiveUsers: Array<{
    id: string
    fullName: string
    documentCount: number
    qaSessionCount: number
  }>
}
