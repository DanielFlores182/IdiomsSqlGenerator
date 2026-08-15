import { FileTerminal, Users } from "lucide-react"

export default function InfoSection() {
  return (
    <section className="info-grid">
      <article className="panel info-panel about">
        <div className="bar">
          <FileTerminal size={14} aria-hidden="true" />
          <span>readme.md</span>
        </div>
        <div className="body">
          <p>
            <span className="prompt">$</span> dbs-gen is a rough, offline-first code generator. drop in a database schema
            file, run the generator, and it emits a plain text artifact you can pipe straight into your project.
          </p>
          <p>
            no accounts, no cloud round-trips, no telemetry. everything runs local in the browser. built for developers
            who like their tools fast, ugly, and honest.
          </p>
          <div className="stack-row">
            <span className="tag">vite</span>
            <span className="tag">react</span>
            <span className="tag">javascript</span>
            <span className="tag">zero-deps</span>
          </div>
        </div>
      </article>

      <article className="panel info-panel">
        <div className="bar">
          <Users size={14} aria-hidden="true" />
          <span>developers</span>
        </div>
        <div className="body">
          <div className="dev-list">
            <div className="dev-row">
              <span className="k">author</span>
              <span className="v">your name here</span>
            </div>
            <div className="dev-row">
              <span className="k">role</span>
              <span className="v">maintainer / frontend</span>
            </div>
            <div className="dev-row">
              <span className="k">contact</span>
              <span className="v">dev@dbs-gen.local</span>
            </div>
            <div className="dev-row">
              <span className="k">repo</span>
              <span className="v">github.com/you/dbs-gen</span>
            </div>
            <div className="dev-row">
              <span className="k">license</span>
              <span className="v">MIT</span>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}
