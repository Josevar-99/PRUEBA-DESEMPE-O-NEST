/**
 * Status shared by workshops and mechanics. Deactivating replaces physical deletion
 * to preserve the maintenance history.
 */
export enum ActiveStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}