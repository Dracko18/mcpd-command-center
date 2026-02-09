import React, { useState, useEffect } from 'react';
import { Shield, ChevronUp } from 'lucide-react';
import { useWindowStore } from '@/stores/windowStore';
import { cn } from '@/lib/utils';

const Taskbar: React.FC<{ onOpenLauncher: () => void }> = ({ onOpenLauncher }) => {
  const { windows, focusWindow, minimizeWindow } = useWindowStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleTaskClick = (id: string, minimized: boolean) => {
    if (minimized) focusWindow(id);
    else minimizeWindow(id);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-mdc-taskbar/95 backdrop-blur-md border-t border-border flex items-center px-2 z-[9999]">
      {/* Start button */}
      <button
        onClick={onOpenLauncher}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-secondary/60 transition-colors mr-2"
      >
        <Shield className="w-5 h-5 text-primary" />
        <span className="text-xs font-mono font-semibold text-primary hidden sm:inline">MCPD</span>
      </button>

      <div className="h-6 w-px bg-border mx-1" />

      {/* Open windows */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto">
        {windows.map(w => (
          <button
            key={w.id}
            onClick={() => handleTaskClick(w.id, w.minimized)}
            className={cn(
              'px-3 py-1 rounded text-xs font-mono truncate max-w-[160px] transition-colors',
              w.minimized ? 'bg-secondary/30 text-muted-foreground' : 'bg-secondary text-foreground border-b-2 border-primary',
            )}
          >
            {w.title}
          </button>
        ))}
      </div>

      {/* Clock */}
      <div className="flex items-center gap-2 px-3">
        <ChevronUp className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs font-mono text-muted-foreground">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
          {time.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default Taskbar;
