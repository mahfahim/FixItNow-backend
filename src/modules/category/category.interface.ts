export type ICategoryFilterRequest = {
  search?: string;
  isActive?: boolean;
};

export type ICreateCategory = {
  name: string;
  icon?: string;
  description?: string;
};

export type IUpdateCategory = Partial<ICreateCategory> & {
  isActive?: boolean;
};