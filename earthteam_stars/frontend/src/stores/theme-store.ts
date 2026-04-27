import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "classic" | "stitch" | "celestial";

const themeOrder: Theme[] = ["classic", "stitch", "celestial"];

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "classic",
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.dataset.theme = theme;
        }
      },
      toggleTheme: () => {
        const idx = themeOrder.indexOf(get().theme);
        const next = themeOrder[(idx + 1) % themeOrder.length];
        get().setTheme(next);
      },
    }),
    {
      name: "earthteam-theme",
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          document.documentElement.dataset.theme = state.theme;
        }
      },
    },
  ),
);
