import React, { useState } from 'react';
import { useWindowStore } from '@/stores/windowStore';
import AppWindow from './AppWindow';
import Taskbar from './Taskbar';
import AppLauncher from './AppLauncher';
import SubjectsApp from '@/components/apps/SubjectsApp';
import RecordsApp from '@/components/apps/RecordsApp';
import AdminApp from '@/components/apps/AdminApp';
import SettingsApp from '@/components/apps/SettingsApp';

const appComponents: Record<string, React.FC> = {
  SubjectsApp,
  RecordsApp,
  AdminApp,
  SettingsApp,
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
          <div className="text-center opacity-10">
            <p className="text-6xl font-mono font-bold tracking-widest text-primary">MCPD</p>
            <p className="text-sm font-mono tracking-[0.5em] text-muted-foreground mt-2">MOBILE DATA COMPUTER</p>
          </div>
        </div>

        {/* Windows */}
        {windows.map(win => {
          const Component = appComponents[win.appId === 'subjects' ? 'SubjectsApp'
            : win.appId === 'records' ? 'RecordsApp'
            : win.appId === 'admin' ? 'AdminApp'
            : win.appId === 'settings' ? 'SettingsApp'
            : 'SubjectsApp'];
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
