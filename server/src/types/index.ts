import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string
    role: string
  }
}

export interface User {
  id: string
  username: string
  email: string
  role: 'USER' | 'ADMIN' | 'MANAGER'
  armyNumber?: string
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  userId: string
  personalDetails?: any
  family?: any
  education?: any
  medical?: any
  others?: any
  leaveData?: any
  salaryData?: any
  createdAt: string
  updatedAt: string
}

export interface RequestData {
  id: string
  type: 'LEAVE' | 'OUTPASS' | 'SALARY' | 'PROFILE_UPDATE'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  data: any
  requesterId: string
  createdAt: string
  updatedAt: string
}

export type AuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void
export type RoleMiddleware = (role: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void
