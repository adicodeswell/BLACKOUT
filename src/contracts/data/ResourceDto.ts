import type { LocationDto } from "../geo/LocationDto";

export type ResourceType =
  | "SHELTER"
  | "FOOD"
  | "WATER"
  | "MEDICINE"
  | "MEDICAL"
  | "OTHER";

export type ResourceAvailability =
  | "UNKNOWN"
  | "AVAILABLE"
  | "LIMITED"
  | "FULL"
  | "CLOSED";

export interface ResourceDto {
  resource_id: string;
  type: ResourceType;
  name: string;
  description?: string;
  location: LocationDto;
  availability: ResourceAvailability;
  capacity?: number;
  remaining_capacity?: number;
  source_device_id: string;
  created_at: number;
  updated_at: number;
  expires_at?: number;
}

export interface CreateResourceRequest {
  type: ResourceType;
  name: string;
  description?: string;
  location: LocationDto;
  availability: ResourceAvailability;
  capacity?: number;
  remaining_capacity?: number;
  expires_at?: number;
}

export interface ResourceFilter {
  type?: ResourceType;
  availability?: ResourceAvailability;
  center?: LocationDto;
  radius_m?: number;
}

export interface UpdateResourceRequest {
  resource_id: string;
  name?: string;
  description?: string;
  availability?: ResourceAvailability;
  capacity?: number;
  remaining_capacity?: number;
  expires_at?: number;
}