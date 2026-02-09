import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { useWindowStore, type WindowState } from '@/stores/windowStore';
import { cn } from '@/lib/utils';

interface AppWindowProps {
  window: WindowState;
  children: React.ReactNode;
}

const AppWindow: React.FC<AppWindowProps> = ({ window: win, children }) => {
  const { closeWindow, minimizeWindow, maximizeWindow, restoreWindow, focusWindow, updatePosition } = useWindowStore();
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (win.maximized) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: win.x, origY: win.y };
    setDragging(true);
    focusWindow(win.id);
  }, [win.maximized, win.x, win.y, win.id, focusWindow]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      updatePosition(win.id, dragRef.current.origX + dx, dragRef.current.origY + dy);
    };
    const onUp = () => { setDragging(false); dragRef.current = null; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [dragging, win.id, updatePosition]);

  if (win.minimized) return null;

  const style: React.CSSProperties = win.maximized
    ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 48, zIndex: win.zIndex }
    : { position: 'absolute', top: win.y, left: win.x, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <div
      style={style}
      className={cn(
        'flex flex-col rounded-lg overflow-hidden border border-border bg-card shadow-2xl',
        'transition-shadow duration-150',
      )}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between h-9 px-3 bg-mdc-window-header border-b border-border select-none cursor-grab active:cursor-grabbing shrink-0"
        onMouseDown={handleMouseDown}
      >
        <span className="text-xs font-mono text-muted-foreground truncate">{win.title}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => minimizeWindow(win.id)} className="p-1 hover:bg-secondary rounded transition-colors">
            <Minus className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={() => win.maximized ? restoreWindow(win.id) : maximizeWindow(win.id)} className="p-1 hover:bg-secondary rounded transition-colors">
            {win.maximized ? <Maximize2 className="w-3 h-3 text-muted-foreground" /> : <Square className="w-3 h-3 text-muted-foreground" />}
          </button>
          <button onClick={() => closeWindow(win.id)} className="p-1 hover:bg-destructive/80 rounded transition-colors">
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default AppWindow;
