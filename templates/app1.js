import { useRef, useState } from "react"

const FORMATS = [
  "TXT — console report (.txt)",
  "CSV — comma separated (.csv)",
  "TSV — tab separated (.tsv)",
  "JSON — array of records (.json)",
]

export default function App() {
  const [fileName, setFileName] = useState("")
  const [over, setOver] = useState(false)
  const inputRef = useRef(null)

  const onInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setFileName(file.name)
  }

  return (
    <div className="wrap">
      <div className="terminal">
        <div className="titlebar">
          <div className="dots" aria-hidden="true">
            <span className="dot r" />
            <span className="dot y" />
            <span className="dot g" />
          </div>
          <span className="title">dbf.convert — /usr/bin/dbf2txt</span>
        </div>

        <div className="screen">
          <h1>
            <span className="prompt">$</span> dbf2txt <span className="blink" />
          </h1>
          <p className="lede">
            Browse a dBASE <code>.dbf</code> database file and generate a downloadable
            text file.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".dbf,application/x-dbf"
            onChange={onInputChange}
            style={{ display: "none" }}
            id="dbf-input"
          />

          <div
            className={`drop${over ? " over" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                inputRef.current?.click()
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            <div className="big">
              {fileName ? `> ${fileName}` : "> click to browse or drop a .dbf file"}
            </div>
            <div className="hint">dBASE III / IV / FoxPro tables supported</div>
          </div>

          <div className="controls">
            <div className="field">
              <label htmlFor="fmt">output</label>
              <select id="fmt" defaultValue={FORMATS[0]}>
                {FORMATS.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button>./download</button>
            <button className="ghost">clear</button>
          </div>

          <div className="preview">
            <h2>preview</h2>
            <pre className="output">{"// output will appear here"}</pre>
          </div>

          <div className="footer">
            no server, no tracking — everything runs locally in your browser.
          </div>
        </div>
      </div>
    </div>
  )
}
