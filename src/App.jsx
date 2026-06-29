import { useState, useRef, useCallback } from "react";
import "./App.css";

// ─── Constants ───────────────────────────────────────────────────
const DB_KEY = "verifyhub_v3_records";
const STATS_KEY = "verifyhub_v3_stats";

function loadRecords() { try { return JSON.parse(localStorage.getItem(DB_KEY) || "[]"); } catch { return []; } }
function saveRecords(r) { try { localStorage.setItem(DB_KEY, JSON.stringify(r)); } catch {} }
function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || "null"); } catch { return null; }
}
function saveStats(s) { try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch {} }
function getStats() {
  const saved = loadStats();
  if (saved) return saved;
  const s = { documents: 128, verified: 120, pending: 8, accuracy: 99.2 };
  saveStats(s); return s;
}

function getToday() {
  return new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}
function getTodayEn() {
  return new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

// ─── Vector SVG Components (Replacing Emojis) ────────────────────
const SvgCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const SvgSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const SvgFolder = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);
const SvgDocument = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const SvgBox = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
);
const SvgCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const SvgXCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
);
const SvgAlertTriangle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);
const SvgHome = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

// ─── Topbar ──────────────────────────────────────────────────────
function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
        </div>
        <div>
          <div className="brand-name">VERIFYHUB</div>
          <div className="brand-tagline">Freight Document Operations Platform</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-date">
          <SvgCalendar />
          <span>{getTodayEn()}</span>
        </div>
        <div className="user-chip">
          <div className="avatar">SB</div>
          <div>
            <div className="user-name">Seabra Team</div>
            <div className="user-dept">Import-Export Dept.</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────
function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb">
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && <span className="bc-sep">›</span>}
          {item.onClick
            ? <a onClick={item.onClick}>{item.label}</a>
            : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────
function DropZone({ files, onFiles, accept, label }) {
  const [over, setOver] = useState(false);
  const ref = useRef();

  const handle = useCallback((rawFiles) => {
    const arr = Array.from(rawFiles).filter(f =>
      f.type.match(/pdf|png|jpeg/i) || f.name.match(/\.(pdf|png|jpg|jpeg)$/i)
    );
    if (arr.length) onFiles(arr);
  }, [onFiles]);

  const onDrop = e => {
    e.preventDefault(); setOver(false);
    handle(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={`drop-zone${over ? " drag-over" : ""}`}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => ref.current.click()}
      >
        <span className="drop-icon"><SvgFolder /></span>
        <div className="drop-label">ลากไฟล์มาวางตรงนี้</div>
        <div className="drop-sub">หรือ <span className="drop-browse">เลือกไฟล์จากเครื่อง</span></div>
        <div className="t-xs" style={{ color: "var(--muted)", marginTop: 6 }}>PDF · PNG · JPG</div>
        <input ref={ref} type="file" multiple accept={accept} style={{ display: "none" }}
          onChange={e => handle(e.target.files)} />
      </div>
      <div className="file-list">
        {files.length
          ? files.map(f => (
            <div key={f.name} className="file-item">
              <span className="file-item-icon"><SvgDocument /></span>
              <span className="file-item-name">{f.name}</span>
              <span className="file-item-size">{formatFileSize(f.size)}</span>
            </div>
          ))
          : <div className="no-files">ยังไม่มีไฟล์</div>}
      </div>
    </div>
  );
}

// ─── Portal Page ──────────────────────────────────────────────────
function Portal({ onNavigate }) {
  const today = getToday();

  return (
    <div>
      <Breadcrumb items={[{ label: "Home" }]} />
      <main className="main">
        <div className="welcome-section">
          <div className="welcome-left">
            <div className="welcome-meta">
              <span className="meta-dot"></span>
              <span className="t-xs" style={{ color: "var(--muted)" }}>2 Workspaces Available · {today}</span>
            </div>
            <div className="welcome-title">Welcome back.</div>
            <div className="welcome-sub" style={{ marginTop: 8 }}>Ready to verify your shipping documents.</div>
          </div>
        </div>

        {/* Banner สรุปสถิติ (stats-row) ถูกนำออกถาวรตามบรีฟงานแล้ว */}

        <div className="section-title">Workspaces</div>
        <div className="portal-grid">
          <div className="portal-card" onClick={() => onNavigate("audit")}>
            <div className="card-header">
              <div className="card-icon-wrap"><SvgSearch /></div>
              <span className="card-badge-tag">Document Audit</span>
            </div>
            <div className="card-title">ตรวจสอบเอกสาร</div>
            <p className="card-desc">เปรียบเทียบข้อมูล B/L กับ Amendment อัตโนมัติ พร้อมรายงานผลแบบ field-by-field</p>
            <ul className="card-features">
              <li><span className="check-icon"><SvgCheckCircle /></span> Bill of Lading (B/L)</li>
              <li><span className="check-icon"><SvgCheckCircle /></span> Amendment Notice</li>
              <li><span className="check-icon"><SvgCheckCircle /></span> Attached Sheet & ไฟล์แนบ</li>
            </ul>
            <button className="card-cta">เริ่มตรวจสอบเอกสาร <span className="arr">→</span></button>
          </div>

          <div className="portal-card" onClick={() => onNavigate("tracking")}>
            <div className="card-header">
              <div className="card-icon-wrap"><SvgBox /></div>
              <span className="card-badge-tag">D/O Management</span>
            </div>
            <div className="card-title">บันทึกรับ D/O</div>
            <p className="card-desc">บันทึกและค้นหาประวัติการรับมอบเอกสาร D/O หน้าเคาน์เตอร์ พร้อม search realtime</p>
            <ul className="card-features">
              <li><span className="check-icon"><SvgCheckCircle /></span> D/O Release Logging</li>
              <li><span className="check-icon"><SvgCheckCircle /></span> Consignee Tracking</li>
              <li><span className="check-icon"><SvgCheckCircle /></span> Quick Search History</li>
            </ul>
            <button className="card-cta">เปิดพื้นที่จัดการ D/O <span className="arr">→</span></button>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}

// ─── Parse AI JSON result ─────────────────────────────────────────
function parseResult(rawText) {
  try {
    const clean = rawText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);
    return Array.isArray(data) ? data : [data];
  } catch {
    return null;
  }
}

// ─── Result Display ───────────────────────────────────────────────
function SummarySection({ summary }) {
  if (!summary) return null;
  return (
    <div className="bl-summary-section">
      <div className="bl-summary-title"><SvgBox /> Weight & Volume Summary</div>
      <div className="bl-summary-grid">
        <div className="bl-summary-item">
          <div className="summary-label">Gross Weight</div>
          <div className="summary-val">{summary.grossWeight?.total || "—"}</div>
          <div className="summary-calc">{summary.grossWeight?.calculation || ""}</div>
          <div style={{ marginTop: 10 }}>
            <span className={`status-indicator ${summary.grossWeight?.status === "MATCH" ? "match" : summary.grossWeight?.status === "REVIEW" ? "review" : "mismatch"}`}>
              {summary.grossWeight?.status === "MATCH" ? <SvgCheckCircle /> : summary.grossWeight?.status === "REVIEW" ? <SvgAlertTriangle /> : <SvgXCircle />}
              {summary.grossWeight?.status}
            </span>
          </div>
        </div>
        <div className="bl-summary-item">
          <div className="summary-label">Total CBM</div>
          <div className="summary-val">{summary.cbm?.total || "—"}</div>
          <div className="summary-calc">{summary.cbm?.calculation || ""}</div>
          <div style={{ marginTop: 10 }}>
            <span className={`status-indicator ${summary.cbm?.status === "MATCH" ? "match" : summary.cbm?.status === "REVIEW" ? "review" : "mismatch"}`}>
              {summary.cbm?.status === "MATCH" ? <SvgCheckCircle /> : summary.cbm?.status === "REVIEW" ? <SvgAlertTriangle /> : <SvgXCircle />}
              {summary.cbm?.status}
            </span>
          </div>
        </div>
        <div className="bl-summary-item bl-summary-overall">
          <div className="summary-label">Overall Result</div>
          <div className={`overall-result-icon ${summary.overall === "PASS" ? "overall-pass" : "overall-fail"}`}>
            {summary.overall === "PASS" ? <SvgCheckCircle /> : <SvgXCircle />}
          </div>
          <div className={`overall-result-text ${summary.overall === "PASS" ? "overall-pass" : "overall-fail"}`}>
            {summary.overall}
          </div>
          <div className="summary-calc">{summary.overall === "PASS" ? "All fields verified" : "Review required"}</div>
        </div>
      </div>
    </div>
  );
}

function ResultDisplay({ data, rawText }) {
  const parsed = parseResult(data || rawText);

  if (!parsed) {
    return (
      <div className="result-card">
        <div className="result-card-header">
          <span className="bl-number"><SvgDocument /> ผลการตรวจสอบ</span>
        </div>
        <div style={{ padding: "20px", fontSize: 13, color: "var(--text-2)", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
          {rawText}
        </div>
      </div>
    );
  }

  const totalMismatch = parsed.reduce((acc, bl) => acc + (bl.items || []).filter(i => i.status === "MISMATCH").length, 0);
  const totalReview   = parsed.reduce((acc, bl) => acc + (bl.items || []).filter(i => i.status === "REVIEW").length, 0);
  const totalItems    = parsed.reduce((acc, bl) => acc + (bl.items || []).length, 0);
  const overallPass   = totalMismatch === 0;
  // Find summary from whichever BL has it
  const globalSummary = parsed.find(bl => bl.summary)?.summary || null;

  function copyResult() {
    navigator.clipboard?.writeText(JSON.stringify(parsed, null, 2));
  }

  return (
    <div>
      {/* ── Banner ── */}
      <div className={`result-banner ${overallPass ? "pass" : totalMismatch <= 2 ? "warn" : "fail"}`}>
        <span className="banner-icon">
          {overallPass ? <SvgCheckCircle /> : totalMismatch <= 2 ? <SvgAlertTriangle /> : <SvgXCircle />}
        </span>
        <div style={{ flex: 1 }}>
          <div className="banner-title">
            {overallPass
              ? "Verification Completed — All documents are consistent."
              : `${totalMismatch} Mismatch${totalMismatch > 1 ? "es" : ""} Found — Review Required`}
          </div>
          <div className="banner-sub">
            Checked {totalItems} fields across {parsed.length} B/L document{parsed.length > 1 ? "s" : ""}
            {totalReview > 0 && ` · ${totalReview} field${totalReview > 1 ? "s" : ""} need review`}
          </div>
        </div>
        {/* Quick stat chips */}
        <div className="banner-stats">
          <span className="bstat match">{totalItems - totalMismatch - totalReview} MATCH</span>
          {totalReview > 0 && <span className="bstat review">{totalReview} REVIEW</span>}
          {totalMismatch > 0 && <span className="bstat mismatch">{totalMismatch} MISMATCH</span>}
        </div>
      </div>

      {/* ── Per-BL cards ── */}
      {parsed.map((bl, i) => {
        const mis = (bl.items || []).filter(x => x.status === "MISMATCH").length;
        const rev = (bl.items || []).filter(x => x.status === "REVIEW").length;
        const badgeClass = mis > 0 ? "badge-fail" : rev > 0 ? "badge-warn" : "badge-pass";
        const badgeText  = mis > 0 ? `✗ ${mis} MISMATCH` : rev > 0 ? `⚠ ${rev} REVIEW` : "✓ PASS";

        return (
          <div key={i} className="result-card">
            {/* BL Header — prominent divider */}
            <div className="bl-card-header">
              <div className="bl-card-index">B/L {String(i + 1).padStart(2, "0")}</div>
              <div className="bl-card-title">
                <SvgDocument />
                <span className="bl-card-number">{bl.bl || `Document ${i + 1}`}</span>
              </div>
              <span className={`bl-status-badge ${badgeClass}`}>{badgeText}</span>
            </div>

            {/* Field comparison table */}
            <div style={{ overflowX: "auto" }}>
              <table className="result-table">
                <thead>
                  <tr>
                    <th style={{ width: "14%" }}>Field</th>
                    <th style={{ width: "28%" }}>ข้อมูล B/L (ต้นฉบับ)</th>
                    <th style={{ width: "28%" }}>ข้อมูล Amend (แก้ไข)</th>
                    <th style={{ width: "12%" }}>Status</th>
                    <th style={{ width: "18%" }}>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {(bl.items || []).map((item, j) => {
                    const rowClass = item.status === "MISMATCH" ? "row-mismatch" : item.status === "REVIEW" ? "row-review" : "";
                    return (
                      <tr key={j} className={rowClass}>
                        <td><span className="field-name">{item.field}</span></td>
                        <td><span className="field-value">{item.original}</span></td>
                        <td>
                          <span className={`field-value ${item.status === "MISMATCH" ? "field-changed" : item.status === "REVIEW" ? "field-review" : ""}`}>
                            {item.amend}
                          </span>
                        </td>
                        <td>
                          <span className={`status-indicator ${item.status === "MATCH" ? "match" : item.status === "REVIEW" ? "review" : "mismatch"}`}>
                            {item.status === "MATCH" ? <SvgCheckCircle /> : item.status === "REVIEW" ? <SvgAlertTriangle /> : <SvgXCircle />}
                            {item.status}
                          </span>
                        </td>
                        <td><span className="remark-text">{item.remark}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Per-BL summary (if this BL has it) */}
            {bl.summary && <SummarySection summary={bl.summary} />}
          </div>
        );
      })}

      {/* ── Global summary (if stored separately / not per-BL) ── */}
      {globalSummary && !parsed.some(bl => bl.summary) && (
        <div className="result-card">
          <div className="result-card-header">
            <span className="bl-number"><SvgBox /> Weight & Volume Summary (Combined)</span>
            <span className={`bl-status-badge ${globalSummary.overall === "PASS" ? "badge-pass" : "badge-fail"}`}>
              Overall: {globalSummary.overall}
            </span>
          </div>
          <SummarySection summary={globalSummary} />
        </div>
      )}

      {/* ── Export bar ── */}
      <div className="export-bar">
        <span className="label">Export:</span>
        <button className="btn btn-secondary" onClick={copyResult}>Copy JSON</button>
        <button className="btn btn-secondary" onClick={() => {
          const txt = JSON.stringify(parsed, null, 2);
          const a = document.createElement("a");
          a.href = "data:text/json," + encodeURIComponent(txt);
          a.download = "verifyhub-result.json";
          a.click();
        }}>Download JSON</button>
        <button className="btn btn-secondary" onClick={() => window.print()}>Print Report</button>
      </div>
    </div>
  );
}

// ─── Audit Page ───────────────────────────────────────────────────
const LOADING_STAGES = [
  { label: "Extracting Document Data...", sub: "Reading B/L and Amendment files" },
  { label: "Comparing Fields...", sub: "Cross-referencing Consignee, Weight, Marks" },
  { label: "Calculating Totals...", sub: "Summing Gross Weight and CBM" },
  { label: "Generating Report...", sub: "Preparing structured output" },
];

function AuditPage({ onBack }) {
  const [blFiles, setBLFiles] = useState([]);
  const [amendFiles, setAmendFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStage, setLoadStage] = useState(0);
  const [step, setStep] = useState(1);

  async function runAudit() {
    if (!blFiles.length || !amendFiles.length || loading) return;
    setLoading(true); setResult(null); setRawText(""); setStep(2);

    const stageTimer = setInterval(() => {
      setLoadStage(s => (s < LOADING_STAGES.length - 1 ? s + 1 : s));
    }, 1800);

    try {
      const content = [];
      for (const f of [...blFiles, ...amendFiles]) {
        const b64 = await fileToBase64(f);
        const mt = f.type || "application/pdf";
        content.push(mt === "application/pdf"
          ? { type: "document", source: { type: "base64", media_type: mt, data: b64 } }
          : { type: "image", source: { type: "base64", media_type: mt, data: b64 } });
      }

      content.push({ type: "text", text: `You are a logistics document compliance auditor for Seabra Trans Freight.
Analyze the uploaded B/L and Amendment documents carefully.

OUTPUT FORMAT: Respond ONLY with valid JSON, no markdown, no preamble.

JSON Structure:
[
  {
    "bl": "B/L number here",
    "items": [
      {
        "field": "Consignee",
        "original": "value from B/L",
        "amend": "value from Amendment",
        "status": "MATCH or MISMATCH or REVIEW",
        "remark": "brief explanation"
      }
    ]
  }
]

Include a "summary" object in the FIRST B/L entry:
"summary": {
  "grossWeight": {
    "total": "combined total",
    "calculation": "X KGS (BL-001) + Y KGS (BL-002) = Z KGS",
    "status": "MATCH or MISMATCH"
  },
  "cbm": {
    "total": "combined total",
    "calculation": "X CBM (BL-001) + Y CBM (BL-002) = Z CBM",
    "status": "MATCH or MISMATCH"
  },
  "overall": "PASS or FAIL"
}

AUDIT RULES:
- Consignee: match company name only, ignore address/building/zip
- Quantity: match numbers and units, ignore formatting
- Description: match core product names, ignore spacing
- Shipping Marks: exact match required
- Status options: MATCH, MISMATCH, REVIEW (use REVIEW when ambiguous)

Fields to check per B/L: Consignee, Quantity, Shipping Marks, Description of Goods, Gross Weight, CBM

Output ONLY the JSON array. Nothing else.` });

      const resp = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content }] }),
      });
      const data = await resp.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "";
      setRawText(text);
      setResult(text);

      const s = getStats();
      s.documents += blFiles.length;
      s.verified += blFiles.length;
      saveStats(s);
      setStep(3);
    } catch (e) {
      setRawText("เกิดข้อผิดพลาด: " + e.message);
      setStep(3);
    }
    clearInterval(stageTimer);
    setLoadStage(0);
    setLoading(false);
  }

  const canRun = blFiles.length > 0 && amendFiles.length > 0 && !loading;

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", onClick: onBack }, { label: "Document Verification" }]} />
      <main className="main">
        
        <div className="header-actions">
          <div className="page-header">
            <div className="page-icon"><SvgSearch /></div>
            <div>
              <div className="page-title-text">Automated Document Verification</div>
              <div className="page-sub">Compare B/L against Amendment — field-by-field with structured report</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <SvgHome /> กลับหน้าหลัก
          </button>
        </div>

        {/* Progress steps */}
        <div className="progress-steps" style={{ marginBottom: 24 }}>
          {[
            { n: 1, label: "Upload Files" },
            { n: 2, label: "Processing" },
            { n: 3, label: "Result" },
          ].map((s, i, arr) => (
            <span key={s.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <span className={`step ${step === s.n ? "active" : step > s.n ? "done" : ""}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="step-num">{step > s.n ? "✓" : s.n}</span>
                <span className="step-label">{s.label}</span>
              </span>
              {i < arr.length - 1 && <span className="step-divider" style={{ flex: 1 }}></span>}
            </span>
          ))}
        </div>

        <div className="upload-grid">
          <div>
            <div className="upload-col-label lbl-bl"><SvgDocument /> Bill of Lading (B/L)</div>
            <DropZone files={blFiles} onFiles={setBLFiles} accept=".pdf,.png,.jpg,.jpeg" label="B/L" />
          </div>
          <div>
            <div className="upload-col-label lbl-am"><SvgDocument /> Amend & Attached Sheet</div>
            <DropZone files={amendFiles} onFiles={setAmendFiles} accept=".pdf,.png,.jpg,.jpeg" label="Amend" />
          </div>
        </div>

        <button className="btn btn-primary btn-full btn-lg" disabled={!canRun} onClick={runAudit}
          style={{ borderRadius: "100px" }}>
          {loading ? "กำลังประมวลผล..." : "ประมวลผลการเปรียบเทียบเอกสาร"}
        </button>

        {loading && (
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <div className="loading-stage">{LOADING_STAGES[loadStage].label}</div>
            <div className="loading-sub">{LOADING_STAGES[loadStage].sub}</div>
          </div>
        )}

        {result && !loading && <div style={{ marginTop: 24 }}><ResultDisplay data={result} rawText={rawText} /></div>}

        <Footer />
      </main>
    </div>
  );
}

// ─── Tracking Page ────────────────────────────────────────────────
function TrackingPage({ onBack }) {
  const [records, setRecords] = useState(loadRecords());
  const [bl, setBL] = useState("");
  const [consignee, setConsignee] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2800); }

  function saveDO() {
    if (!bl.trim()) { showToast("โปรดกรอกหมายเลข B/L"); return; }
    const next = records.filter(r => r.bl !== bl.trim());
    next.push({ bl: bl.trim(), consignee: consignee.trim() || "ลูกค้าหน้าเคาน์เตอร์", date: getToday() });
    setRecords(next); saveRecords(next);
    setBL(""); setConsignee("");
    showToast("บันทึก " + bl.trim() + " เรียบร้อยแล้ว");
  }

  function clearAll() {
    if (window.confirm("ยืนยันลบข้อมูลทั้งหมด?")) {
      setRecords([]); saveRecords([]);
      showToast("ล้างข้อมูลทั้งหมดแล้ว");
    }
  }

  const filtered = records.filter(r =>
    r.bl.toLowerCase().includes(search.toLowerCase()) ||
    r.consignee.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {toast && <div className="toast show">{toast}</div>}
      <Breadcrumb items={[{ label: "Home", onClick: onBack }, { label: "D/O Management" }]} />
      <main className="main">
        
        <div className="header-actions">
          <div className="page-header">
            <div className="page-icon"><SvgBox /></div>
            <div>
              <div className="page-title-text">D/O Release Management</div>
              <div className="page-sub">บันทึกและค้นหาประวัติการรับมอบเอกสาร Delivery Order</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <SvgHome /> กลับหน้าหลัก
          </button>
        </div>

        <div className="tracking-section-title"><span className="sec-dot"></span>บันทึกการรับ D/O</div>
        <div className="form-row">
          <div className="form-group">
            <label>หมายเลข Bill of Lading (B/L)</label>
            <input type="text" placeholder="เช่น PKELCH2660002" value={bl} onChange={e => setBL(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveDO()} />
          </div>
          <div className="form-group">
            <label>ชื่อบริษัทลูกค้า / Consignee</label>
            <input type="text" placeholder="เช่น SIAM LOGISTICS CO., LTD." value={consignee} onChange={e => setConsignee(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveDO()} />
          </div>
        </div>
        <button className="btn btn-primary" style={{ borderRadius: "100px", padding: "11px 28px" }} onClick={saveDO}>
          บันทึกการรับมอบเอกสาร
        </button>

        <hr className="divider" />

        <div className="tracking-section-title"><span className="sec-dot"></span>ค้นหาประวัติ</div>
        <div className="search-wrap">
          <span className="search-icon"><SvgSearch /></span>
          <input type="text" placeholder="พิมพ์เลข B/L หรือชื่อ Consignee..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          แสดง {filtered.length} รายการ {search && `(กรองจาก "${search}")`}
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr><th>เลขที่ B/L</th><th>Consignee</th><th>วันที่รับ D/O</th></tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(r => (
                <tr key={r.bl}>
                  <td><strong style={{ fontFamily: "monospace", fontSize: 13 }}>{r.bl}</strong></td>
                  <td>{r.consignee}</td>
                  <td><span className="date-badge">{r.date}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="empty-row" style={{ textAlign: "center", color: "var(--muted)", padding: 48 }}>ยังไม่มีข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="danger-zone">
          <div className="danger-label"><SvgAlertTriangle /> Administrator Zone</div>
          <button className="btn btn-danger" onClick={clearAll}>ล้างฐานข้อมูลทั้งหมด</button>
        </div>

        <Footer />
      </main>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-name">VERIFYHUB</div>
      <div className="footer-meta">Version 1.0 · Freight Document Operations Platform · Department of Logistics</div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("portal");
  return (
    <div>
      <TopBar />
      {page === "portal"   && <Portal onNavigate={setPage} />}
      {page === "audit"    && <AuditPage onBack={() => setPage("portal")} />}
      {page === "tracking" && <TrackingPage onBack={() => setPage("portal")} />}
    </div>
  );
}