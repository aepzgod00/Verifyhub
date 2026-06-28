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

// ─── SVG Icons ───────────────────────────────────────────────────
const Icons = {
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Target: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Package: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  FolderOpen: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  File: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
      <polyline points="13 2 13 9 20 9"/>
    </svg>
  ),
  CheckMark: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Printer: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  AlertOctagon: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
};

// ─── Topbar ──────────────────────────────────────────────────────
function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <Icons.Shield />
        </div>
        <div>
          <div className="brand-name">VERIFYHUB</div>
          <div className="brand-tagline">Freight Document Operations Platform</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-date">
          <Icons.Calendar />
          {getTodayEn()}
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
        <span className="drop-icon"><Icons.FolderOpen /></span>
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
              <span className="file-item-icon"><Icons.File /></span>
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
  const stats = getStats();
  const today = getToday();

  const statCards = [
    { label: "Documents", value: stats.documents, sub: "Total processed", Icon: Icons.FileText },
    { label: "Verified", value: stats.verified, sub: "Completed", Icon: Icons.CheckCircle },
    { label: "Pending", value: stats.pending, sub: "Awaiting review", Icon: Icons.Clock },
    { label: "Accuracy", value: stats.accuracy + "%", sub: "Overall rate", Icon: Icons.Target },
  ];

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

        <div className="stats-row">
          {statCards.map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-icon-wrap"><s.Icon /></div>
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="section-title">Workspaces</div>
        <div className="portal-grid">
          <div className="portal-card" onClick={() => onNavigate("audit")}>
            <div className="card-header">
              <div className="card-icon-wrap"><Icons.Search /></div>
              <span className="card-badge-tag">Document Audit</span>
            </div>
            <div className="card-title">ตรวจสอบเอกสาร</div>
            <p className="card-desc">เปรียบเทียบข้อมูล B/L กับ Amendment อัตโนมัติ พร้อมรายงานผลแบบ field-by-field</p>
            <ul className="card-features">
              <li><span className="check-icon"><Icons.CheckMark /></span> Bill of Lading (B/L)</li>
              <li><span className="check-icon"><Icons.CheckMark /></span> Amendment Notice</li>
              <li><span className="check-icon"><Icons.CheckMark /></span> Attached Sheet & ไฟล์แนบ</li>
            </ul>
            <button className="card-cta">เริ่มตรวจสอบเอกสาร <span className="arr">→</span></button>
          </div>

          <div className="portal-card" onClick={() => onNavigate("tracking")}>
            <div className="card-header">
              <div className="card-icon-wrap"><Icons.Package /></div>
              <span className="card-badge-tag">D/O Management</span>
            </div>
            <div className="card-title">บันทึกรับ D/O</div>
            <p className="card-desc">บันทึกและค้นหาประวัติการรับมอบเอกสาร D/O หน้าเคาน์เตอร์ พร้อม search realtime</p>
            <ul className="card-features">
              <li><span className="check-icon"><Icons.CheckMark /></span> D/O Release Logging</li>
              <li><span className="check-icon"><Icons.CheckMark /></span> Consignee Tracking</li>
              <li><span className="check-icon"><Icons.CheckMark /></span> Quick Search History</li>
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
function ResultDisplay({ data, rawText }) {
  const parsed = parseResult(data || rawText);

  if (!parsed) {
    return (
      <div className="result-card">
        <div className="result-card-header">
          <span className="bl-number">ผลการตรวจสอบ</span>
        </div>
        <div style={{ padding: "20px", fontSize: 13, color: "var(--text-2)", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
          {rawText}
        </div>
      </div>
    );
  }

  const totalMismatch = parsed.reduce((acc, bl) => acc + (bl.items || []).filter(i => i.status === "MISMATCH").length, 0);
  const totalItems = parsed.reduce((acc, bl) => acc + (bl.items || []).length, 0);
  const overallPass = totalMismatch === 0;
  const isWarn = !overallPass && totalMismatch <= 2;

  function copyResult() {
    navigator.clipboard?.writeText(JSON.stringify(parsed, null, 2));
  }

  const bannerClass = overallPass ? "pass" : isWarn ? "warn" : "fail";
  const BannerIcon = overallPass ? Icons.CheckCircle : isWarn ? Icons.AlertTriangle : Icons.XCircle;

  return (
    <div>
      {/* Banner */}
      <div className={`result-banner ${bannerClass}`}>
        <span className={`banner-icon ${bannerClass}`}><BannerIcon /></span>
        <div>
          <div className="banner-title">
            {overallPass
              ? "Verification Completed — All documents are consistent."
              : `${totalMismatch} Mismatch${totalMismatch > 1 ? "es" : ""} Found — Review Required`}
          </div>
          <div className="banner-sub">Checked {totalItems} fields across {parsed.length} B/L document{parsed.length > 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Per-BL cards */}
      {parsed.map((bl, i) => {
        const mis = (bl.items || []).filter(x => x.status === "MISMATCH").length;
        return (
          <div key={i} className="result-card">
            <div className="result-card-header">
              <span className="bl-number"><Icons.Clipboard /> {bl.bl || `Document ${i + 1}`}</span>
              <span className={`bl-status-badge ${mis === 0 ? "badge-pass" : "badge-fail"}`}>
                {mis === 0 ? "✓ PASS" : `✗ ${mis} MISMATCH`}
              </span>
            </div>
            <table className="result-table">
              <thead>
                <tr>
                  <th>Field</th><th>ข้อมูล B/L</th><th>ข้อมูล Amend</th><th>Status</th><th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {(bl.items || []).map((item, j) => (
                  <tr key={j}>
                    <td><span className="field-name">{item.field}</span></td>
                    <td><span className="field-value">{item.original}</span></td>
                    <td><span className="field-value">{item.amend}</span></td>
                    <td>
                      <span className={item.status === "MATCH" ? "badge-match" : item.status === "REVIEW" ? "badge-review" : "badge-mismatch"}>
                        {item.status === "MATCH" ? "● MATCH" : item.status === "REVIEW" ? "◐ REVIEW" : "● MISMATCH"}
                      </span>
                    </td>
                    <td><span className="remark-text">{item.remark}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Summary card */}
      {parsed[0]?.summary && (
        <div className="summary-card">
          <div className="result-card-header">
            <span className="bl-number"><Icons.BarChart /> Weight & Volume Summary</span>
            <span className={`bl-status-badge ${parsed[0].summary.overall === "PASS" ? "badge-pass" : "badge-fail"}`}>
              Overall: {parsed[0].summary.overall}
            </span>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-label">Gross Weight</div>
              <div className="summary-val">{parsed[0].summary.grossWeight?.total || "—"}</div>
              <div className="summary-calc">{parsed[0].summary.grossWeight?.calculation || ""}</div>
              <div style={{ marginTop: 8 }}>
                <span className={parsed[0].summary.grossWeight?.status === "MATCH" ? "badge-match" : "badge-mismatch"}>
                  {parsed[0].summary.grossWeight?.status === "MATCH" ? "● MATCH" : "● MISMATCH"}
                </span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total CBM</div>
              <div className="summary-val">{parsed[0].summary.cbm?.total || "—"}</div>
              <div className="summary-calc">{parsed[0].summary.cbm?.calculation || ""}</div>
              <div style={{ marginTop: 8 }}>
                <span className={parsed[0].summary.cbm?.status === "MATCH" ? "badge-match" : "badge-mismatch"}>
                  {parsed[0].summary.cbm?.status === "MATCH" ? "● MATCH" : "● MISMATCH"}
                </span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Overall Result</div>
              <div style={{ fontSize: 32, margin: "8px 0", color: parsed[0].summary.overall === "PASS" ? "var(--success)" : "var(--error)" }}>
                {parsed[0].summary.overall === "PASS" ? "✓" : "✗"}
              </div>
              <div className="summary-calc">{parsed[0].summary.overall === "PASS" ? "All fields verified" : "Review required"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Export bar */}
      <div className="export-bar">
        <span className="label">Export:</span>
        <button className="btn btn-secondary" onClick={copyResult}>
          <Icons.Clipboard /> Copy JSON
        </button>
        <button className="btn btn-secondary" onClick={() => {
          const txt = JSON.stringify(parsed, null, 2);
          const a = document.createElement("a");
          a.href = "data:text/json," + encodeURIComponent(txt);
          a.download = "verifyhub-result.json";
          a.click();
        }}><Icons.Download /> Download JSON</button>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Icons.Printer /> Print Report
        </button>
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

      // Update stats
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
        <div className="page-header">
          <div className="page-icon"><Icons.Search /></div>
          <div>
            <div className="page-title-text">Automated Document Verification</div>
            <div className="page-sub">Compare B/L against Amendment — field-by-field with structured report</div>
          </div>
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
            <div className="upload-col-label lbl-bl">
              <Icons.FileText /> Bill of Lading (B/L)
            </div>
            <DropZone files={blFiles} onFiles={setBLFiles} accept=".pdf,.png,.jpg,.jpeg" label="B/L" />
          </div>
          <div>
            <div className="upload-col-label lbl-am">
              <Icons.Edit /> Amend & Attached Sheet
            </div>
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
        <div className="page-header">
          <div className="page-icon"><Icons.Package /></div>
          <div>
            <div className="page-title-text">D/O Release Management</div>
            <div className="page-sub">บันทึกและค้นหาประวัติการรับมอบเอกสาร Delivery Order</div>
          </div>
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
          <span className="search-icon"><Icons.Search /></span>
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
          <div className="danger-label">
            <Icons.AlertOctagon /> Administrator Zone
          </div>
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
