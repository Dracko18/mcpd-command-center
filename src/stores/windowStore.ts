import { create } from 'zustand';

export interface MCPDApp {
  id: string;
  title: string;
  icon: string; // SVG icon name from lucide
  component: string; // component key
  adminOnly?: boolean;
  rolesRequired?: string[];
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

interface WindowStore {
  windows: WindowState[];
  nextZIndex: number;
  openApp: (app: MCPDApp) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateSize: (id: string, width: number, height: number) => void;
}

let windowCounter = 0;

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  nextZIndex: 1,

  openApp: (app) => {
    const existing = get().windows.find(w => w.appId === app.id && !w.minimized);
    if (existing) {
      get().focusWindow(existing.id);
      return;
    }
    const minimized = get().windows.find(w => w.appId === app.id && w.minimized);
    if (minimized) {
      get().restoreWindow(minimized.id);
      return;
    }

    windowCounter++;
    const offset = (windowCounter % 8) * 30;
    const nz = get().nextZIndex;
    const newWindow: WindowState = {
      id: `win-${Date.now()}-${windowCounter}`,
      appId: app.id,
      title: app.title,
      x: 100 + offset,
      y: 60 + offset,
      width: 800,
      height: 550,
      minimized: false,
      maximized: false,
      zIndex: nz,
    };
    set({ windows: [...get().windows, newWindow], nextZIndex: nz + 1 });
  },

  closeWindow: (id) => set({ windows: get().windows.filter(w => w.id !== id) }),

  minimizeWindow: (id) => set({
    windows: get().windows.map(w => w.id === id ? { ...w, minimized: true } : w),
  }),

  maximizeWindow: (id) => {
    const nz = get().nextZIndex;
    set({
      windows: get().windows.map(w => w.id === id ? { ...w, maximized: true, zIndex: nz } : w),
      nextZIndex: nz + 1,
    });
  },

  restoreWindow: (id) => {
    const nz = get().nextZIndex;
    set({
      windows: get().windows.map(w => w.id === id ? { ...w, maximized: false, minimized: false, zIndex: nz } : w),
      nextZIndex: nz + 1,
    });
  },

  focusWindow: (id) => {
    const nz = get().nextZIndex;
    set({
      windows: get().windows.map(w => w.id === id ? { ...w, zIndex: nz, minimized: false } : w),
      nextZIndex: nz + 1,
    });
  },

  updatePosition: (id, x, y) => set({
    windows: get().windows.map(w => w.id === id ? { ...w, x, y } : w),
  }),

  updateSize: (id, width, height) => set({
    windows: get().windows.map(w => w.id === id ? { ...w, width, height } : w),
  }),
}));
