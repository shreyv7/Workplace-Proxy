import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 text-sidebar-foreground/75 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
    >
      {theme === "dark" ? (
        <Sun
          className="h-4 w-4 opacity-80 transition-transform duration-200 group-hover:scale-105"
          strokeWidth={1.75}
        />
      ) : (
        <Moon
          className="h-4 w-4 opacity-80 transition-transform duration-200 group-hover:scale-105"
          strokeWidth={1.75}
        />
      )}
      <span className="font-normal tracking-wide">
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}
