export type NavigationTab = 
  | 'overview'
  | 'prescriptions'
  | 'interactions'
  | 'rules'
  | 'audit-log'
  | 'settings';

export interface NavItem {
  id: NavigationTab;
  label: string;
  badge?: string;
  section?: 'clinical' | 'system';
}
