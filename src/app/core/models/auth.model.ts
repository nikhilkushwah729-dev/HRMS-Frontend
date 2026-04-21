// Auth Models for HRNexus

export interface Role {
    id: number;
    name: string;
    slug?: string;
    scope?: 'global' | 'organization' | 'team' | 'self';
}

export type AccessScope = 'global' | 'organization' | 'team' | 'self' | 'finance' | 'all';
export type RbacRoleName = 'Super Admin' | 'Organization Admin' | 'Admin' | 'Manager' | 'Employee';

export interface User {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  companyLogo?: string;
  organizationName?: string;
  organizationLogo?: string;
  phone?: string;
  role?: Role | string;
  roleId?: number;
  roleSlug?: string;
  roleScope?: AccessScope;
  avatar?: string | null;
  organizationId?: number;
  orgId?: number;
  employeeId?: number;
  employeeCode?: string;
  status?: string;
  designationId?: number;
  departmentId?: number;
  managerId?: number;
  reportingManagerId?: number;
  subordinateIds?: number[];
  hierarchyPath?: number[];
  countryCode?: string;
  countryName?: string;
  joinDate?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  salary?: string | number;
  bankAccount?: string;
  bankName?: string;
  ifscCode?: string;
  panNumber?: string;
  createdAt?: string;
  loginType?: string;
  phoneAuthEnabled?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  isLocked?: boolean;
  paySlip?: number;
  salarySlip?: number;
  shiftChangePerm?: number;
  profileType?: number;
  hrSts?: number;
  setupConfig?: number;
  esslSetupConfig?: number;
  biometricMachinePermission?: number;
  addonDeviceVerification?: number;
  visitorManagementAddOn?: number;
  settingPerm?: number;
  department?: { id: number; name: string };
  designation?: { id: number; name: string };
  permissions?: string[];
  accessScope?: AccessScope;
}

export interface AuthResponse {
    token: string;
    user: User;
    message?: string;
    requiresOtp?: boolean;
    requires2fa?: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName?: string;
    phone?: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface EmailVerificationRequest {
    token: string;
}
