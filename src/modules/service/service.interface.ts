export type ICreateServicePayload = {
  categoryId: string;
  technicianId?: string;
  title: string;
  description: string;
  price: number;
  duration: number; // minutes
  images?: string[];
  serviceArea?: string[];
};

export type IUpdateServicePayload = Partial<ICreateServicePayload> & {
  isAvailable?: boolean;
};

export type IServiceFilterOptions = {
  search?: string;
  categoryId?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export const serviceSearchableFields = ['title', 'description'];
export const serviceFilterableFields = [
  'search',
  'categoryId',
  'minPrice',
  'maxPrice',
];