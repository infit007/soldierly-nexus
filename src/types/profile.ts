// Shared profile and request section types for Manager/User/Admin UI
// These mirror Prisma schema fields in `UserProfile` while keeping flexibility

export interface PersonalDetails {
  firstName?: string
  lastName?: string
  fullName?: string
  dateOfBirth?: string // ISO date
  rank?: string
  serviceNumber?: string
  unit?: string
  address?: string
  phone?: string
  email?: string
  bloodGroup?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  // Allow extra fields as needed without breaking
  [key: string]: unknown
}

export interface FamilyMember {
  name: string
  relation: string // e.g., Spouse, Father, Mother, Child
  age?: number
  phone?: string
  occupation?: string
  [key: string]: unknown
}

export interface Family {
  members?: FamilyMember[]
  dependentsCount?: number
  [key: string]: unknown
}

export interface EducationEntry {
  institution?: string
  degree?: string
  fieldOfStudy?: string
  startYear?: number
  endYear?: number
  grade?: string
  [key: string]: unknown
}

export interface Education {
  entries?: EducationEntry[]
  highestQualification?: string
  [key: string]: unknown
}

export interface MedicalRecord {
  conditions?: string[]
  medications?: string[]
  allergies?: string[]
  lastCheckupDate?: string // ISO date
  fitnessCategory?: string
  [key: string]: unknown
}

export interface Others {
  // Arbitrary extra structured info
  notes?: string
  attachments?: { name: string; url: string }[]
  [key: string]: unknown
}

export interface LeaveData {
  reason?: string
  startDate?: string // ISO date
  endDate?: string // ISO date
  approvedBy?: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  [key: string]: unknown
}

export interface SalaryData {
  base?: number
  allowance?: number
  bonus?: number
  currency?: string
  effectiveDate?: string // ISO date
  [key: string]: unknown
}

// Full registration/profile aggregate stored in UserProfile
export interface RegistrationProfile {
  personalDetails?: PersonalDetails | null
  family?: Family | null
  education?: Education | null
  medical?: MedicalRecord | null
  others?: Others | null
  leaveData?: LeaveData | null
  salaryData?: SalaryData | null
  updatedAt?: string | null
}

// Discriminated union payload for manager profile edits
export type ProfileEditSection =
  | 'personal'
  | 'family'
  | 'education'
  | 'medical'
  | 'others'
  | 'leave'
  | 'salary'

export type ProfileEditDataMap = {
  personal: PersonalDetails
  family: Family
  education: Education
  medical: MedicalRecord
  others: Others
  leave: LeaveData
  salary: SalaryData
}

export type ManagerProfileEditPayload =
  | { section: 'personal'; data: PersonalDetails }
  | { section: 'family'; data: Family }
  | { section: 'education'; data: Education }
  | { section: 'medical'; data: MedicalRecord }
  | { section: 'others'; data: Others }
  | { section: 'leave'; data: LeaveData }
  | { section: 'salary'; data: SalaryData }
