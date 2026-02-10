import type { MCPDApp } from '@/stores/windowStore';

export const MCPD_APPS: MCPDApp[] = [
  { id: 'subjects', title: 'Base de Personas', icon: 'Users', component: 'SubjectsApp' },
  { id: 'records', title: 'Archivos Criminales', icon: 'FileText', component: 'RecordsApp' },
  { id: 'vehicles', title: 'Registro Vehicular', icon: 'Car', component: 'VehiclesApp' },
  { id: 'reports', title: 'Reportes', icon: 'ClipboardList', component: 'ReportsApp' },
  { id: 'ai', title: 'Asistente IA', icon: 'Bot', component: 'AIAssistantApp' },
  { id: 'ia', title: 'Asuntos Internos', icon: 'ShieldAlert', component: 'InternalAffairsApp', rolesRequired: ['administrator', 'internal_affairs'] },
  { id: 'admin', title: 'Panel Admin', icon: 'Shield', component: 'AdminApp', adminOnly: true },
  { id: 'settings', title: 'Configuración', icon: 'Settings', component: 'SettingsApp' },
];
