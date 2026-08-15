import { useState, useEffect } from "react"
import { Zap } from "lucide-react"
import TitleBar from "./components/TitleBar.jsx"
import DropZone from "./components/DropZone.jsx"
import OutputConsole from "./components/OutputConsole.jsx"
import InfoSection from "./components/InfoSection.jsx"
import "./App.css"

export default function App() {
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"))

  return (
    <main className="app">
      <TitleBar theme={theme} onToggleTheme={toggleTheme} />

      <div className="headline">
        <h1>
          DBS
          <br />
          GEN
        </h1>
        <p className="blurb">
          browse a database format file, run the generator, and get a plain text result. rough, fast, offline.
        </p>
      </div>

      <div className="grid">
        <DropZone />
        <OutputConsole />
      </div>

      <button type="button" className="btn primary block" style={{ fontSize: 16, padding: "16px" }}>
        <Zap size={20} aria-hidden="true" />
        generate result
      </button>

      <InfoSection />

      <p className="footer mono-caps">
        dbs-gen v1.0 · {theme === "dark" ? "grey-amber build" : "matcha-light build"} · press [enter] to run
      </p>
    </main>
  )
}
