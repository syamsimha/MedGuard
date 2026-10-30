export type NavigationTab = 
  | 'dashboard'
  | 'patients'
  | 'medication-review'
  | 'safety-alerts'
  | 'clinical-reports'
  | 'settings'
  // Preserved for backwards compatibility with earlier components:
  | 'overview'
  | 'prescriptions'
  | 'interactions'
  | 'rules'
  | 'audit-log';

export interface NavItemConfig {
  id: NavigationTab;
  label: string;
  badge?: string;
  badgeVariant?: 'neutral' | 'warning' | 'danger' | 'info';
}
