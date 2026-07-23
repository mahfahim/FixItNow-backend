export type ICreateReviewPayload = {
  bookingId: string;
  rating: number; // Integer: 1 to 5
  comment?: string;
};

export type IReviewFilterOptions = {
  searchTerm?: string;
  rating?: number;
  technicianId?: string;
  customerId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};