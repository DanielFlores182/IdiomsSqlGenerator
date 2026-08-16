import { Download, Terminal } from "lucide-react"

const SAMPLE = `> parsing schema ................ no schema
> waiting for input ............. idle
> output ........................ unavailable

// output will appear here after you
// run the generator on a .dbs file
`

export default function OutputConsole({ output }) {

  const displayContent = output || SAMPLE;


  const handleDownload = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel console">
      <div className="bar">
        <Terminal size={15} aria-hidden="true" />
        <span>output.txt</span>
        <span className="status">{output ? "DONE" : "READY"}</span>
      </div>
      
      <pre>
        {displayContent}
        <span className="caret" aria-hidden="true" />
      </pre>
      
      <div style={{ padding: 16, borderTop: "var(--border-w) solid var(--ink)" }}>
        <button 
          type="button" 
          className="btn primary block"
          onClick={handleDownload}
          disabled={!output}
        >
          <Download size={18} aria-hidden="true" />
          download output.txt
        </button>
      </div>
    </section>
  )
}