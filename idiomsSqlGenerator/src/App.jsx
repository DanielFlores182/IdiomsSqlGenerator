import { useState, useEffect } from "react"
import { Zap } from "lucide-react"
import TitleBar from "./components/TitleBar.jsx"
import DropZone from "./components/DropZone.jsx"
import OutputConsole from "./components/OutputConsole.jsx"
import InfoSection from "./components/InfoSection.jsx"
import { parseDBSFile } from "./utils/dbsParser.js" // <-- Importamos nuestra lógica
import "./App.css"

export default function App() {
  const [theme, setTheme] = useState("light")
  
  const [file, setFile] = useState(null)
  const [output, setOutput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"))

  const handleGenerate = async () => {
    if (!file) {
      alert("Por favor, selecciona un archivo .dbs primero en la zona de drop.")
      return
    }

    setIsGenerating(true)
    setOutput("> parsing schema ................\n> generating output.txt ......... running")

    try {
      const resultLog = await parseDBSFile(file)
      
      //retraso para el efecto visual de la consola
      setTimeout(() => {
        setOutput(resultLog)
        setIsGenerating(false)
      }, 600)

    } catch (error) {
      setOutput(`> parsing schema ................ ERROR\n// Error details: ${error.message}`)
      setIsGenerating(false)
    }
  }

  return (
    <main className="app">
      <TitleBar theme={theme} onToggleTheme={toggleTheme} />

      <div className="headline">
        <h1>
          IDIOMS
          <br />
          BRIDGE
        </h1>
        <p className="blurb">
          browse a dbschema format project file, run the generator, and get a plain-text output you can run in PostgreSQL grounded with Idioms. Rough. Fast. Offline. Theory-backed.
        </p>
      </div>

      <div className="grid">
        <DropZone onFile={setFile} />
        <OutputConsole output={output} />
      </div>

      <button 
        type="button" 
        className="btn primary block" 
        style={{ fontSize: 16, padding: "16px" }}
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        <Zap size={20} aria-hidden="true" />
        {isGenerating ? "generating..." : "generate result"}
      </button>

      <InfoSection />

      <p className="footer mono-caps">
        i-bridge v1.0 · {theme === "dark" ? "grey-amber build" : "matcha-light build"} · press [enter] to run
      </p>
    </main>
  )
}