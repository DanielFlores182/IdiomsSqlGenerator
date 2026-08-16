import React, { useRef, useState } from "react"
import { HardDrive, FolderSearch } from "lucide-react"

const FORMATS = [".dbs", ".xml", ".xhtml"]

export default function DropZone({ onFile }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")

    function openFileDialog() {
    setError("")
    inputRef.current?.click()
  }

  function handleFiles(files) {
    setError("")
    if (!files || files.length === 0) return

    const file = files[0]
    const name = file.name.toLowerCase()

    if (name.endsWith(".xml") || name.endsWith(".xhtml")) {
      setError("only .dbs file are supported untill the next update")
      setFileName("")
      return
    }

    if (!name.endsWith(".dbs")) {
      setError("file format not supported. please choose a .dbs file.")
      setFileName("")
      return
    }

    setFileName(file.name)
    if (onFile) onFile(file)
  }

  function handleInputChange(e) {
    handleFiles(e.target.files)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer?.files)
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!dragActive) setDragActive(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  return (
    <section 
      className={`panel dropzone ${dragActive ? "drag-active" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{ opacity: dragActive ? 0.7 : 1, transition: "opacity 0.2s" }}
    >
      
      <input
        ref={inputRef}
        type="file"
        accept=".dbs,.xml,.xhtml"
        style={{ display: "none" }}
        onChange={handleInputChange}
      />

      <div className="section-head">
        <span className="tag">01</span>
        <span className="idx mono-caps">input // database file</span>
      </div>

      <div className="well">
        <HardDrive size={40} strokeWidth={1.5} aria-hidden="true" />
        <p className="mono-caps">drop a .dbs file here</p>
        
        <p className="fname" style={{ color: fileName ? "var(--ink)" : "inherit" }}>
          {fileName || "— no file selected —"}
        </p>
        
        {error && (
          <p style={{ color: "crimson", marginTop: "8px", fontSize: "0.85rem", maxWidth: "80%", textAlign: "center" }}>
            {error}
          </p>
        )}
      </div>

      <div className="fmt-row" aria-label="supported formats">
        {FORMATS.map((f) => (
          <span className="tag" key={f} style={{ background: "transparent", color: "var(--ink)" }}>
            {f}
          </span>
        ))}
      </div>

      <button type="button" className="btn block" onClick={openFileDialog}>
        <FolderSearch size={18} aria-hidden="true" />
        browse files
      </button>
    </section>
  )
}