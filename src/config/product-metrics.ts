/**
 * Centralized Product Metrics & Workspace Counters
 * Single Source of Truth for M25 and Global Counters
 */

export const PRODUCT_METRICS = {
  productionModules: 25,
  managerWorkspaces: 25,
  totalBaseScreens: 55,
  totalResponsiveBaseViews: 165,
  prototypeJourneys: 4,
  userTestingTasks: 4,
} as const;

export type ProductMetrics = typeof PRODUCT_METRICS;
