import { Download, Terminal } from "lucide-react"

const SAMPLE = `> parsing schema ................ ok
> tables detected ............... 04
> generating result.txt ......... idle

// output will appear here after you
// run the generator on a .dbs file
`

export default function OutputConsole() {
  return (
    <section className="panel console">
      <div className="bar">
        <Terminal size={15} aria-hidden="true" />
        <span>result.txt</span>
        <span className="status">READY</span>
      </div>
      <pre>
        {SAMPLE}
        <span className="caret" aria-hidden="true" />
      </pre>
      <div style={{ padding: 16, borderTop: "var(--border-w) solid var(--ink)" }}>
        <button type="button" className="btn primary block">
          <Download size={18} aria-hidden="true" />
          download result.txt
        </button>
      </div>
    </section>
  )
}
