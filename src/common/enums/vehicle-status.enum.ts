/**
 * Vehicle statuses (requirement 2.8). AVAILABLE and IN_MAINTENANCE are changed
 * by the maintenance cycle; INACTIVE is the logical deletion.
 */
export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  INACTIVE = 'INACTIVE',
}