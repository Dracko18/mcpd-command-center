import React, { useState } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import { MCPD_APPS } from '@/config/apps';
import AppWindow from './AppWindow';
import Taskbar from './Taskbar';
import AppLauncher from './AppLauncher';
import SubjectsApp from '@/components/apps/SubjectsApp';
import RecordsApp from '@/components/apps/RecordsApp';
import VehiclesApp from '@/components/apps/VehiclesApp';
import ReportsApp from '@/components/apps/ReportsApp';
import InternalAffairsApp from '@/components/apps/InternalAffairsApp';
import AdminApp from '@/components/apps/AdminApp';
import SettingsApp from '@/components/apps/SettingsApp';
import AIAssistantApp from '@/components/apps/AIAssistantApp';
import mcpdLogo from '@/assets/mcpd-logo.png';

const appComponents: Record<string, React.FC> = {
  SubjectsApp,
  RecordsApp,
  VehiclesApp,
  ReportsApp,
  InternalAffairsApp,
  AdminApp,
  SettingsApp,
  AIAssistantApp,
};

const Desktop: React.FC = () => {
  const { windows } = useWindowStore();
  const [launcherOpen, setLauncherOpen] = useState(false);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden mdc-scanline">
      {/* Desktop area */}
      <div className="absolute inset-0 bottom-12">
        {/* Wallpaper overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-mdc-navy via-background to-mdc-charcoal opacity-80" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="text-center opacity-15">
            <img src={mcpdLogo} alt="MCPD" className="w-24 h-24 mx-auto mb-4 opacity-60" />
            <p className="text-6xl font-mono font-bold tracking-widest text-primary">MCPD</p>
            <p className="text-sm font-mono tracking-[0.5em] text-muted-foreground mt-2">MOBILE DATA COMPUTER</p>
          </div>
        </div>

        {/* Windows */}
        {windows.map(win => {
          const app = MCPD_APPS.find(a => a.id === win.appId);
          const Component = app ? appComponents[app.component] : null;
          if (!Component) return null;
          return (
            <AppWindow key={win.id} window={win}>
              <Component />
            </AppWindow>
          );
        })}
      </div>

      {/* Taskbar */}
      <Taskbar onOpenLauncher={() => setLauncherOpen(o => !o)} />
      <AppLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)} />
    </div>
  );
};

export default Desktop;
