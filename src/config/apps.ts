import type { MCPDApp } from '@/stores/windowStore';

export const MCPD_APPS: MCPDApp[] = [
  { id: 'subjects', title: 'Subjects Database', icon: 'Users', component: 'SubjectsApp' },
  { id: 'records', title: 'Criminal Records', icon: 'FileText', component: 'RecordsApp' },
  { id: 'admin', title: 'Admin Panel', icon: 'Shield', component: 'AdminApp', adminOnly: true },
  { id: 'settings', title: 'Settings', icon: 'Settings', component: 'SettingsApp' },
];
