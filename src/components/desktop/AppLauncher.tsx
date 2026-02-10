import React from 'react';
import { Users, FileText, Shield, Settings, LogOut, Car, ClipboardList, ShieldAlert } from 'lucide-react';
import { MCPD_APPS } from '@/config/apps';
import { useWindowStore, type MCPDApp } from '@/stores/windowStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Users, FileText, Shield, Settings, Car, ClipboardList, ShieldAlert,
};

interface AppLauncherProps {
  open: boolean;
  onClose: () => void;
}

const AppLauncher: React.FC<AppLauncherProps> = ({ open, onClose }) => {
  const { openApp } = useWindowStore();
  const { profile, isAdmin, roles, signOut } = useAuth();

  if (!open) return null;

  const visibleApps = MCPD_APPS.filter(app => {
    if (app.adminOnly && !isAdmin) return false;
    if (app.rolesRequired && !app.rolesRequired.some(r => roles.includes(r as any))) return false;
    return true;
  });

  const handleOpen = (app: MCPDApp) => {
    openApp(app);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div className="absolute bottom-14 left-2 z-[9999] w-72 bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">{profile?.full_name || 'Officer'}</p>
          <p className="text-xs font-mono text-muted-foreground">Badge #{profile?.badge_number} • {profile?.rank}</p>
        </div>

        {/* Apps */}
        <div className="p-2 grid grid-cols-2 gap-1">
          {visibleApps.map(app => {
            const Icon = iconMap[app.icon] || Shield;
            return (
              <button
                key={app.id}
                onClick={() => handleOpen(app)}
                className="flex flex-col items-center gap-2 p-3 rounded-md hover:bg-secondary/60 transition-colors"
              >
                <Icon className="w-6 h-6 text-primary" />
                <span className="text-xs text-foreground text-center leading-tight">{app.title}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border">
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-4 h-4 text-destructive" />
            <span className="text-xs text-destructive">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AppLauncher;
