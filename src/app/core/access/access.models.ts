import { User } from '../models/auth.model';

export type RoleName = 'admin' | 'employee' | 'manager' | 'hr' | string;

export interface Permission {
  key: string;
  allowed: boolean;
}

export type PermissionItem = Permission;

export interface Addons {
  attendance?: boolean;
  leave?: boolean;
  payroll?: boolean;
  visitorManagement?: boolean;
  projects?: boolean;
  expenses?: boolean;
  timesheets?: boolean;
  reports?: boolean;
  settings?: boolean;
  [key: string]: boolean | undefined;
}

export interface TabsAccess {
  employee?: boolean;
  attendance?: boolean;
  leave?: boolean;
  payroll?: boolean;
  reports?: boolean;
  selfService?: boolean;
  admin?: boolean;
  [key: string]: boolean | undefined;
}

export interface UserInfoAccess {
  paySlip?: number | string | null;
  salarySlip?: number | string | null;
  shiftChangePerm?: number | boolean | null;
  [key: string]: unknown;
}

export interface AccessUser extends Omit<Partial<User>, 'permissions'> {
  role: RoleName;
  permissions: string[] | PermissionItem[] | Record<string, boolean | 0 | 1 | '0' | '1'>;
  addons: Addons;
  tabs: TabsAccess;
  userInfo: UserInfoAccess;
}

export interface AccessCondition {
  permission?: string | string[];
  addon?: string | string[];
  tab?: string | string[];
  userInfo?: {
    key: keyof UserInfoAccess | string;
    operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'truthy';
    value?: unknown;
  }[];
}

export interface MenuItemConfig {
  id: string;
  label: string;
  route: string;
  icon?: string;
  moduleSlug?: string;
  description?: string;
  context?: string;
  lockedDescription?: string;
  accent?: string;
  quickLinkTone?: string;
  permission?: string | string[];
  addon?: string | string[];
  tab?: string | string[];
  userInfo?: AccessCondition['userInfo'];
  children?: MenuItemConfig[];
  badge?: string;
  exact?: boolean;
}

export interface MenuSectionConfig {
  id: string;
  label: string;
  description?: string;
  route?: string;
  items: MenuItemConfig[];
}

export type AccessBlockReason = 'permission' | 'addon' | 'tab' | 'userInfo';

export interface AccessEvaluation {
  allowed: boolean;
  discoverable: boolean;
  lockedByAddon: boolean;
  blockedBy: AccessBlockReason[];
}

export interface WorkspaceModuleView extends MenuItemConfig {
  sectionId: string;
  sectionLabel: string;
  sectionDescription?: string;
  isAccessible: boolean;
  isLocked: boolean;
  lockReason: string | null;
}
