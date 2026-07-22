//src/modules/admin/admin.interface.ts
import { Role, UserStatus } from '../../../generated/prisma/client';

export type IUserManagementFilterOptions = {
  role?: Role;
  status?: UserStatus;
  search?: string;
};

export type IUpdateUserStatusPayload = {
  status: UserStatus;
};

export type ICreateCategoryPayload = {
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
};