import { HardDrive, FolderSearch } from "lucide-react"

const FORMATS = [".sql", ".db", ".sqlite", ".dbf", ".csv", ".json"]

export default function DropZone() {
  return (
    <section className="panel dropzone">
      <div className="section-head">
        <span className="tag">01</span>
        <span className="idx mono-caps">input // database file</span>
      </div>

      <div className="well">
        <HardDrive size={40} strokeWidth={1.5} aria-hidden="true" />
        <p className="mono-caps">drop a .dbs file here</p>
        <p className="fname">— no file selected —</p>
      </div>

      <div className="fmt-row" aria-label="supported formats">
        {FORMATS.map((f) => (
          <span className="tag" key={f} style={{ background: "transparent", color: "var(--ink)" }}>
            {f}
          </span>
        ))}
      </div>

      <button type="button" className="btn block">
        <FolderSearch size={18} aria-hidden="true" />
        browse files
      </button>
    </section>
  )
}
