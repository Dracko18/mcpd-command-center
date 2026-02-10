import type { MCPDApp } from '@/stores/windowStore';

export const MCPD_APPS: MCPDApp[] = [
  { id: 'subjects', title: 'Subjects Database', icon: 'Users', component: 'SubjectsApp' },
  { id: 'records', title: 'Criminal Records', icon: 'FileText', component: 'RecordsApp' },
  { id: 'vehicles', title: 'Vehicle Registry', icon: 'Car', component: 'VehiclesApp' },
  { id: 'reports', title: 'Reports', icon: 'ClipboardList', component: 'ReportsApp' },
  { id: 'ai', title: 'AI Assistant', icon: 'Bot', component: 'AIAssistantApp' },
  { id: 'ia', title: 'Internal Affairs', icon: 'ShieldAlert', component: 'InternalAffairsApp', rolesRequired: ['administrator', 'internal_affairs'] },
  { id: 'admin', title: 'Admin Panel', icon: 'Shield', component: 'AdminApp', adminOnly: true },
  { id: 'settings', title: 'Settings', icon: 'Settings', component: 'SettingsApp' },
];
