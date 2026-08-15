import { Sun, Moon } from "lucide-react"

export default function TitleBar({ theme, onToggleTheme }) {
  const isDark = theme === "dark"
  return (
    <header className="titlebar">
      <div className="dots" aria-hidden="true">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
      <span className="title">~/i-bridge $ ./run</span>
      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={isDark ? "switch to light mode" : "switch to dark mode"}
      >
        {isDark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
        {isDark ? "light" : "dark"}
      </button>
    </header>
  )
}
