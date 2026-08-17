import { Download, Terminal } from "lucide-react"

const SAMPLE = `> parsing schema ................ no schema
> waiting for input ............. idle
> output ........................ unavailable

// output will appear here after you
// run the generator on a .dbs file
`
const escapeHtml = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getHighlightedText = (text) => {
  if (!text) return { __html: "" };

  let safeText = escapeHtml(text);

  let html = safeText
    .replace(/(classified_by)/g, '<span class="kw-rel">$1</span>')
    .replace(/\b(is_a_)\b/g, '<span class="kw-rel">$1</span>')
    .replace(/(detail_of)/g, '<span class="kw-rel">$1</span>')
    .replace(/(composed_by)/g, '<span class="kw-rel">$1</span>')
    .replace(/\b(is_historical_reflexive_with)\b/g, '<span class="kw-rel">$1</span>')
    .replace(/\b(is_reflexive)\b/g, '<span class="kw-rel">$1</span>')
    .replace(/\b(is_basic)\b/g, '<span class="kw-rel">$1</span>');

  return { __html: html };
};

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
        <span dangerouslySetInnerHTML={getHighlightedText(displayContent)} />
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