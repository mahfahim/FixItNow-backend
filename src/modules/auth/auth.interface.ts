//src/modules/auth/auth.interface.ts
export interface ILoginUser {
  email: string;
  password: string;
}

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  role: "CUSTOMER" | "TECHNICIAN" | "ADMIN";
}

export type IUpdateUserProfile = {
  name?: string;
};

export type ICreateAddress = {
  label?: string;
  addressLine: string;
  city: string;
  district: string;
  postalCode?: string;
  isDefault?: boolean;
};
