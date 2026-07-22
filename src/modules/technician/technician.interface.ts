// src/modules/technician/technician.interface.ts
import { Weekday } from '../../../generated/prisma/enums';


export type IUpdateTechnicianProfile = {
  bio?: string;
  yearsOfExperience?: number;
  hourlyRate?: number;
  profileImage?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
};

export type IAvailabilitySlotPayload = {
  weekday: Weekday;
  startTime: string; 
  endTime: string;  
  isAvailable?: boolean;
};

export type ITechnicianFilterOptions = {
  search?: string;
  city?: string;
  district?: string;
  minRating?: string | number;
};